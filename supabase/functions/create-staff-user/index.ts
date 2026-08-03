import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

serve(async (req) => {
  try {
    // ---------- 1. Авторизация вызывающего ----------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization header" }, 401);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const jwt = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
      error: callerError,
    } = await admin.auth.getUser(jwt);

    if (callerError || !caller) {
      return json({ error: "Invalid token" }, 401);
    }

    // ---------- 2. Входные данные ----------
    const { clinicStaffId, email, password } = await req.json();

    if (!clinicStaffId || !email || !password) {
      return json(
        { error: "clinicStaffId, email and password are required" },
        400
      );
    }
    if (typeof password !== "string" || password.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }

    // ---------- 3. Целевая запись clinic_staff ----------
    const { data: target, error: targetError } = await admin
      .from("clinic_staff")
      .select("id, clinic_id, full_name, phone, staff_account_id")
      .eq("id", clinicStaffId)
      .single();

    if (targetError || !target) {
      return json({ error: "Employee not found" }, 404);
    }
    if (target.staff_account_id) {
      return json({ error: "Employee already has an account" }, 409);
    }

    // ---------- 4. Проверка: вызывающий — активный manager ЭТОЙ клиники ----------
    const { data: callerAccount } = await admin
      .from("staff_accounts")
      .select("id")
      .eq("auth_user_id", caller.id)
      .eq("is_active", true)
      .single();

    if (!callerAccount) {
      return json({ error: "Caller has no staff account" }, 403);
    }

    const { data: callerMembership } = await admin
      .from("clinic_staff")
      .select("id")
      .eq("staff_account_id", callerAccount.id)
      .eq("clinic_id", target.clinic_id)
      .eq("role", "manager")
      .eq("is_active", true)
      .maybeSingle();

    if (!callerMembership) {
      return json(
        { error: "Only clinic manager can create staff accounts" },
        403
      );
    }

    // ---------- 5. Создание auth-пользователя ----------
    const { data: authUser, error: authError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return json({ error: authError.message }, 400);
    }

    // ---------- 6. Создание staff_accounts ----------
    const { data: account, error: accountError } = await admin
      .from("staff_accounts")
      .insert({
        auth_user_id: authUser.user.id,
        full_name: target.full_name,
        email,
        phone: target.phone,
        is_active: true,
      })
      .select("id")
      .single();

    if (accountError) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      return json({ error: accountError.message }, 400);
    }

    // ---------- 7. Линковка clinic_staff → staff_accounts ----------
    const { error: linkError } = await admin
      .from("clinic_staff")
      .update({ staff_account_id: account.id })
      .eq("id", clinicStaffId);

    if (linkError) {
      // откат
      await admin.from("staff_accounts").delete().eq("id", account.id);
      await admin.auth.admin.deleteUser(authUser.user.id);
      return json({ error: linkError.message }, 400);
    }

    return json({
      success: true,
      staffAccountId: account.id,
      authUserId: authUser.user.id,
    });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500
    );
  }
});