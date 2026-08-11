import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
} from "@/features/accounting/hooks/useExpenses";
import type {
  ExpenseCategory,
  ExpensePaymentMethod,
} from "@/shared/api/expenses/expenses.service";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

const CATEGORIES: ExpenseCategory[] = [
  "rent", "salary", "doctor_payout", "supplies", "lab", "equipment",
  "repair", "utilities", "marketing", "software", "tax", "bank_fee", "other",
];

const CATEGORY_KEY: Record<ExpenseCategory, string> = {
  rent: "rent",
  salary: "salary",
  doctor_payout: "doctorPayout",
  supplies: "supplies",
  lab: "lab",
  equipment: "equipment",
  repair: "repair",
  utilities: "utilities",
  marketing: "marketing",
  software: "software",
  tax: "tax",
  bank_fee: "bankFee",
  other: "other",
};

const PAYMENT_METHODS: ExpensePaymentMethod[] = ["cash", "card", "transfer"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function AccountingExpensesPage() {
  const { t } = useTranslation();
  const { clinic } = useClinic();

  const { data: expenses = [], isLoading } = useExpenses(clinic?.clinicId);
  const createExpense = useCreateExpense(clinic?.clinicId);
  const deleteExpense = useDeleteExpense(clinic?.clinicId);

  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    category: "other" as ExpenseCategory,
    amount: "",
    expenseDate: todayStr(),
    vendor: "",
    paymentMethod: "cash" as ExpensePaymentMethod,
    comment: "",
  });

  const filtered = useMemo(
    () => (categoryFilter === "all" ? expenses : expenses.filter((e) => e.category === categoryFilter)),
    [expenses, categoryFilter]
  );

  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const submit = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;
    await createExpense.mutateAsync({
      category: form.category,
      amount,
      expenseDate: form.expenseDate,
      vendor: form.vendor || null,
      paymentMethod: form.paymentMethod,
      comment: form.comment || null,
    });
    setForm({ category: "other", amount: "", expenseDate: todayStr(), vendor: "", paymentMethod: "cash", comment: "" });
    setShowForm(false);
  };

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between">
          <h1 className="text-xl font-extrabold text-gray-900">{t("accountingExpenses.title")}</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            + {t("accountingExpenses.add")}
          </button>
        </div>

        {showForm && (
          <div className="grid shrink-0 grid-cols-2 gap-2 rounded-2xl border border-teal-200 bg-teal-50/40 p-3 md:grid-cols-6">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`accountingExpenses.categories.${CATEGORY_KEY[c]}`)}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder={t("accountingExpenses.fields.amount")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <input
              type="date"
              value={form.expenseDate}
              onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <input
              value={form.vendor}
              onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
              placeholder={t("accountingExpenses.fields.vendor")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value as ExpensePaymentMethod }))}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(`cashier.${m}`)}
                </option>
              ))}
            </select>
            <input
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder={t("accountingExpenses.fields.comment")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <div className="col-span-2 flex gap-2 md:col-span-6">
              <button
                onClick={submit}
                disabled={createExpense.isPending || !form.amount}
                className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}

        <div className="flex shrink-0 items-center justify-between">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | "all")}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
          >
            <option value="all">{t("cashier.filterAll")}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`accountingExpenses.categories.${CATEGORY_KEY[c]}`)}
              </option>
            ))}
          </select>
          <span className="text-sm font-semibold text-gray-700">
            {t("accountingReports.billed")}: {total} ₼
          </span>
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">{t("accountingExpenses.empty")}</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-24 shrink-0 text-xs text-gray-400">{e.expenseDate}</span>
                  <span className="w-40 shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-center text-xs font-semibold text-gray-600">
                    {t(`accountingExpenses.categories.${CATEGORY_KEY[e.category]}`)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-gray-700">{e.vendor ?? "—"}</div>
                    {e.comment && <div className="truncate text-xs text-gray-400">{e.comment}</div>}
                  </div>
                  {e.paymentMethod && (
                    <span className="shrink-0 text-xs text-gray-400">{t(`cashier.${e.paymentMethod}`)}</span>
                  )}
                  <span className="w-24 shrink-0 text-right text-sm font-bold text-gray-900">{e.amount} ₼</span>
                  <button
                    onClick={() => deleteExpense.mutate(e.id)}
                    className="shrink-0 text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
