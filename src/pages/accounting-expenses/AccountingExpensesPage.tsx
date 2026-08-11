import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
  useApproveExpense,
  useRejectExpense,
} from "@/features/accounting/hooks/useExpenses";
import { useApprovalThreshold, useSetApprovalThreshold } from "@/features/accounting/hooks/useFinanceSettings";
import type {
  ExpenseCategory,
  ExpensePaymentMethod,
} from "@/shared/api/expenses/expenses.service";
import { UserRole } from "@/shared/types/auth";
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
  const isManager = clinic?.role === UserRole.Manager;

  const { data: expenses = [], isLoading } = useExpenses(clinic?.clinicId);
  const createExpense = useCreateExpense(clinic?.clinicId);
  const deleteExpense = useDeleteExpense(clinic?.clinicId);
  const approveExpense = useApproveExpense(clinic?.clinicId);
  const rejectExpense = useRejectExpense(clinic?.clinicId);

  const { data: threshold } = useApprovalThreshold(clinic?.clinicId);
  const setThreshold = useSetApprovalThreshold(clinic?.clinicId);
  const [thresholdInput, setThresholdInput] = useState("");
  const [editingThreshold, setEditingThreshold] = useState(false);

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

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = useMemo(
    () => (categoryFilter === "all" ? expenses : expenses.filter((e) => e.category === categoryFilter)),
    [expenses, categoryFilter]
  );

  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  const submit = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return;
    const status = threshold !== null && threshold !== undefined && amount > threshold ? "pending" : "approved";
    await createExpense.mutateAsync({
      category: form.category,
      amount,
      expenseDate: form.expenseDate,
      vendor: form.vendor || null,
      paymentMethod: form.paymentMethod,
      comment: form.comment || null,
      status,
    });
    setForm({ category: "other", amount: "", expenseDate: todayStr(), vendor: "", paymentMethod: "cash", comment: "" });
    setShowForm(false);
  };

  const saveThreshold = async () => {
    const value = thresholdInput.trim() === "" ? null : parseFloat(thresholdInput);
    await setThreshold.mutateAsync(value !== null && !isNaN(value) ? value : null);
    setEditingThreshold(false);
  };

  const approve = (id: string) => {
    if (!clinic) return;
    approveExpense.mutate({ id, approvedBy: clinic.clinicStaffId });
  };

  const confirmReject = async (id: string) => {
    if (!clinic || !rejectReason.trim()) return;
    await rejectExpense.mutateAsync({ id, approvedBy: clinic.clinicStaffId, reason: rejectReason.trim() });
    setRejectingId(null);
    setRejectReason("");
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

        <div className="flex shrink-0 items-center gap-2 text-sm text-gray-600">
          <span className="font-semibold">{t("accountingExpenses.approvalThreshold")}:</span>
          {editingThreshold ? (
            <>
              <input
                type="number"
                min={0}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                placeholder={t("accountingExpenses.approvalThresholdPlaceholder")}
                className="w-28 rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none focus:border-teal-500"
              />
              <button
                onClick={saveThreshold}
                disabled={setThreshold.isPending}
                className="rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => setEditingThreshold(false)}
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                {t("common.cancel")}
              </button>
            </>
          ) : (
            <>
              <span>{threshold != null ? `${threshold} ₼` : t("accountingExpenses.approvalThresholdNotSet")}</span>
              {isManager && (
                <button
                  onClick={() => {
                    setThresholdInput(threshold != null ? String(threshold) : "");
                    setEditingThreshold(true);
                  }}
                  className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                >
                  {t("common.edit")}
                </button>
              )}
            </>
          )}
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
                <div key={e.id} className="flex flex-col gap-1.5 px-4 py-2.5">
                  <div className="flex items-center gap-3">
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
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        e.status === "pending"
                          ? "bg-amber-50 text-amber-600"
                          : e.status === "rejected"
                          ? "bg-red-50 text-red-500"
                          : "bg-teal-50 text-teal-600"
                      }`}
                    >
                      {t(`accountingExpenses.status.${e.status}`)}
                    </span>
                    <span className="w-24 shrink-0 text-right text-sm font-bold text-gray-900">{e.amount} ₼</span>
                    <button
                      onClick={() => deleteExpense.mutate(e.id)}
                      className="shrink-0 text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>

                  {e.status === "rejected" && e.rejectionReason && (
                    <div className="ml-24 text-xs text-red-500">{e.rejectionReason}</div>
                  )}

                  {e.status === "pending" && isManager && (
                    <div className="ml-24 flex items-center gap-2">
                      <button
                        onClick={() => approve(e.id)}
                        disabled={approveExpense.isPending}
                        className="rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
                      >
                        {t("accountingExpenses.approve")}
                      </button>
                      {rejectingId === e.id ? (
                        <>
                          <input
                            value={rejectReason}
                            onChange={(ev) => setRejectReason(ev.target.value)}
                            placeholder={t("accountingExpenses.rejectionReasonPlaceholder")}
                            className="w-48 rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none focus:border-teal-500"
                          />
                          <button
                            onClick={() => confirmReject(e.id)}
                            disabled={rejectExpense.isPending || !rejectReason.trim()}
                            className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-40"
                          >
                            {t("accountingExpenses.confirmReject")}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            {t("common.cancel")}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setRejectingId(e.id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                        >
                          {t("accountingExpenses.reject")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorDeskLayout>
  );
}
