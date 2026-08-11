import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useClinic } from "@/app/providers/clinic";
import { useAccountingInvoices } from "@/features/accounting/hooks/useAccountingInvoices";
import { useExpenses } from "@/features/accounting/hooks/useExpenses";
import {
  useBankAccounts,
  useCreateBankAccount,
  useBankTransactions,
  useCreateBankTransaction,
  useDeleteBankTransaction,
  useMatchBankTransaction,
  useUnmatchBankTransaction,
} from "@/features/accounting/hooks/useBank";
import type { BankTransactionDirection } from "@/shared/api/accounting/bank.service";
import { UserRole } from "@/shared/types/auth";
import { DoctorDeskLayout } from "@/pages/doctor-desk/DoctorDeskLayout";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function AccountingBankPage() {
  const { t } = useTranslation();
  const { clinic } = useClinic();
  const isManager = clinic?.role === UserRole.Manager;

  const { data: accounts = [], isLoading: accountsLoading } = useBankAccounts(clinic?.clinicId);
  const createAccount = useCreateBankAccount(clinic?.clinicId);

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const activeAccountId = selectedAccountId ?? accounts[0]?.id ?? null;
  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? null;

  const { data: transactions = [], isLoading: txLoading } = useBankTransactions(activeAccountId ?? undefined);
  const createTx = useCreateBankTransaction(activeAccountId ?? undefined);
  const deleteTx = useDeleteBankTransaction(activeAccountId ?? undefined);
  const matchTx = useMatchBankTransaction(activeAccountId ?? undefined);
  const unmatchTx = useUnmatchBankTransaction(activeAccountId ?? undefined);

  const { data: invoices = [] } = useAccountingInvoices(clinic?.clinicId);
  const { data: expenses = [] } = useExpenses(clinic?.clinicId);

  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: "",
    bankName: "",
    accountNumber: "",
    currency: "AZN",
    openingBalance: "",
  });

  const [showTxForm, setShowTxForm] = useState(false);
  const [txForm, setTxForm] = useState({
    direction: "in" as BankTransactionDirection,
    amount: "",
    transactionDate: todayStr(),
    description: "",
  });

  const [matchingId, setMatchingId] = useState<string | null>(null);

  const allPayments = useMemo(
    () =>
      invoices.flatMap((inv) =>
        inv.payments
          .filter((p) => p.paymentMethod !== "cash")
          .map((p) => ({ ...p, patientName: inv.patientName }))
      ),
    [invoices]
  );

  const matchedPaymentIds = useMemo(
    () => new Set(transactions.filter((tx) => tx.matchedPaymentId).map((tx) => tx.matchedPaymentId)),
    [transactions]
  );
  const matchedExpenseIds = useMemo(
    () => new Set(transactions.filter((tx) => tx.matchedExpenseId).map((tx) => tx.matchedExpenseId)),
    [transactions]
  );

  const availablePayments = useMemo(
    () => allPayments.filter((p) => !matchedPaymentIds.has(p.id)),
    [allPayments, matchedPaymentIds]
  );
  const availableExpenses = useMemo(
    () => expenses.filter((e) => e.paymentMethod !== "cash" && !matchedExpenseIds.has(e.id)),
    [expenses, matchedExpenseIds]
  );

  const paymentById = useMemo(() => new Map(allPayments.map((p) => [p.id, p])), [allPayments]);
  const expenseById = useMemo(() => new Map(expenses.map((e) => [e.id, e])), [expenses]);

  const summary = useMemo(() => {
    const totalIn = transactions.filter((tx) => tx.direction === "in").reduce((s, tx) => s + tx.amount, 0);
    const totalOut = transactions.filter((tx) => tx.direction === "out").reduce((s, tx) => s + tx.amount, 0);
    const unmatchedCount = transactions.filter((tx) => !tx.matchedPaymentId && !tx.matchedExpenseId).length;
    const opening = activeAccount?.openingBalance ?? 0;
    return { totalIn, totalOut, balance: opening + totalIn - totalOut, unmatchedCount };
  }, [transactions, activeAccount]);

  const submitAccount = async () => {
    if (!accountForm.name.trim()) return;
    await createAccount.mutateAsync({
      name: accountForm.name,
      bankName: accountForm.bankName || null,
      accountNumber: accountForm.accountNumber || null,
      currency: accountForm.currency || "AZN",
      openingBalance: parseFloat(accountForm.openingBalance) || 0,
    });
    setAccountForm({ name: "", bankName: "", accountNumber: "", currency: "AZN", openingBalance: "" });
    setShowAccountForm(false);
  };

  const submitTx = async () => {
    const amount = parseFloat(txForm.amount);
    if (!amount || amount <= 0 || !activeAccountId || !clinic) return;
    await createTx.mutateAsync({
      bankAccountId: activeAccountId,
      clinicId: clinic.clinicId,
      direction: txForm.direction,
      amount,
      transactionDate: txForm.transactionDate,
      description: txForm.description || null,
    });
    setTxForm({ direction: "in", amount: "", transactionDate: todayStr(), description: "" });
    setShowTxForm(false);
  };

  const isLoading = accountsLoading;

  return (
    <DoctorDeskLayout>
      <div className="flex h-full flex-col gap-3 overflow-hidden">
        <div className="flex shrink-0 items-center justify-between">
          <h1 className="text-xl font-extrabold text-gray-900">{t("accountingBank.title")}</h1>
          {isManager && (
            <button
              onClick={() => setShowAccountForm((v) => !v)}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              + {t("accountingBank.addAccount")}
            </button>
          )}
        </div>

        {showAccountForm && (
          <div className="grid shrink-0 grid-cols-2 gap-2 rounded-2xl border border-teal-200 bg-teal-50/40 p-3 md:grid-cols-5">
            <input
              value={accountForm.name}
              onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))}
              placeholder={t("accountingBank.fields.name")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <input
              value={accountForm.bankName}
              onChange={(e) => setAccountForm((f) => ({ ...f, bankName: e.target.value }))}
              placeholder={t("accountingBank.fields.bankName")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <input
              value={accountForm.accountNumber}
              onChange={(e) => setAccountForm((f) => ({ ...f, accountNumber: e.target.value }))}
              placeholder={t("accountingBank.fields.accountNumber")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <input
              value={accountForm.currency}
              onChange={(e) => setAccountForm((f) => ({ ...f, currency: e.target.value }))}
              placeholder={t("accountingBank.fields.currency")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <input
              type="number"
              min={0}
              value={accountForm.openingBalance}
              onChange={(e) => setAccountForm((f) => ({ ...f, openingBalance: e.target.value }))}
              placeholder={t("accountingBank.fields.openingBalance")}
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
            />
            <div className="col-span-2 flex gap-2 md:col-span-5">
              <button
                onClick={submitAccount}
                disabled={createAccount.isPending || !accountForm.name}
                className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
              >
                {t("common.save")}
              </button>
              <button
                onClick={() => setShowAccountForm(false)}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
        ) : accounts.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
            {t("accountingBank.noAccounts")}
          </div>
        ) : (
          <>
            {accounts.length > 1 && (
              <div className="flex shrink-0 gap-2">
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedAccountId(a.id)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                      activeAccountId === a.id ? "bg-teal-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid shrink-0 grid-cols-4 gap-2">
              <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="text-xs text-gray-400">{t("accountingBank.summary.opening")}</div>
                <div className="text-sm font-bold text-gray-900">{activeAccount?.openingBalance ?? 0} {activeAccount?.currency}</div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="text-xs text-gray-400">{t("accountingBank.summary.in")}</div>
                <div className="text-sm font-bold text-teal-600">{summary.totalIn} {activeAccount?.currency}</div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="text-xs text-gray-400">{t("accountingBank.summary.out")}</div>
                <div className="text-sm font-bold text-red-500">{summary.totalOut} {activeAccount?.currency}</div>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                <div className="text-xs text-gray-400">{t("accountingBank.summary.balance")}</div>
                <div className="text-sm font-bold text-gray-900">{summary.balance} {activeAccount?.currency}</div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between">
              <span className="text-sm text-gray-500">
                {t("accountingBank.summary.unmatchedCount", { count: summary.unmatchedCount })}
              </span>
              <button
                onClick={() => setShowTxForm((v) => !v)}
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                + {t("accountingBank.addTransaction")}
              </button>
            </div>

            {showTxForm && (
              <div className="grid shrink-0 grid-cols-2 gap-2 rounded-2xl border border-teal-200 bg-teal-50/40 p-3 md:grid-cols-5">
                <select
                  value={txForm.direction}
                  onChange={(e) => setTxForm((f) => ({ ...f, direction: e.target.value as BankTransactionDirection }))}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
                >
                  <option value="in">{t("accountingBank.direction.in")}</option>
                  <option value="out">{t("accountingBank.direction.out")}</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={txForm.amount}
                  onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder={t("accountingBank.fields.amount")}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
                />
                <input
                  type="date"
                  value={txForm.transactionDate}
                  onChange={(e) => setTxForm((f) => ({ ...f, transactionDate: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
                />
                <input
                  value={txForm.description}
                  onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t("accountingBank.fields.description")}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-teal-500"
                />
                <div className="col-span-2 flex gap-2 md:col-span-5">
                  <button
                    onClick={submitTx}
                    disabled={createTx.isPending || !txForm.amount}
                    className="rounded-lg bg-teal-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-40"
                  >
                    {t("common.save")}
                  </button>
                  <button
                    onClick={() => setShowTxForm(false)}
                    className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
              {txLoading ? (
                <div className="p-10 text-center text-gray-400">{t("common.loading")}</div>
              ) : transactions.length === 0 ? (
                <div className="p-10 text-center text-gray-400">{t("accountingBank.noTransactions")}</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {transactions.map((tx) => {
                    const matchedPayment = tx.matchedPaymentId ? paymentById.get(tx.matchedPaymentId) : null;
                    const matchedExpense = tx.matchedExpenseId ? expenseById.get(tx.matchedExpenseId) : null;
                    const isMatched = !!matchedPayment || !!matchedExpense;
                    const candidates = tx.direction === "in" ? availablePayments : availableExpenses;

                    return (
                      <div key={tx.id} className="flex flex-col gap-2 px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="w-24 shrink-0 text-xs text-gray-400">{tx.transactionDate}</span>
                          <span
                            className={`w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-semibold ${
                              tx.direction === "in" ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-500"
                            }`}
                          >
                            {t(`accountingBank.direction.${tx.direction}`)}
                          </span>
                          <div className="min-w-0 flex-1 truncate text-sm text-gray-700">
                            {tx.description ?? "—"}
                          </div>
                          <span className="w-24 shrink-0 text-right text-sm font-bold text-gray-900">{tx.amount} {activeAccount?.currency}</span>
                          {isMatched ? (
                            <>
                              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                                {t("accountingBank.matched")}
                              </span>
                              <button
                                onClick={() => unmatchTx.mutate(tx.id)}
                                className="shrink-0 text-xs font-semibold text-gray-400 hover:text-red-500"
                              >
                                {t("accountingBank.unmatch")}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setMatchingId(matchingId === tx.id ? null : tx.id)}
                              className="shrink-0 text-xs font-semibold text-teal-600 hover:text-teal-700"
                            >
                              {t("accountingBank.match")}
                            </button>
                          )}
                          <button
                            onClick={() => deleteTx.mutate(tx.id)}
                            className="shrink-0 text-gray-400 hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>

                        {isMatched && (
                          <div className="ml-24 text-xs text-gray-400">
                            {matchedPayment && `${t("accountingBank.matchedToPayment")}: ${matchedPayment.patientName ?? "—"} · ${matchedPayment.amount} ₼ · ${matchedPayment.paidAt?.slice(0, 10)}`}
                            {matchedExpense && `${t("accountingBank.matchedToExpense")}: ${matchedExpense.vendor ?? "—"} · ${matchedExpense.amount} ₼ · ${matchedExpense.expenseDate}`}
                          </div>
                        )}

                        {matchingId === tx.id && (
                          <div className="ml-24 max-h-40 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2">
                            {candidates.length === 0 ? (
                              <div className="p-2 text-xs text-gray-400">{t("accountingBank.noCandidates")}</div>
                            ) : (
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              candidates.map((c: any) => (
                                <button
                                  key={c.id}
                                  onClick={async () => {
                                    if (tx.direction === "in") {
                                      await matchTx.mutateAsync({ id: tx.id, paymentId: c.id });
                                    } else {
                                      await matchTx.mutateAsync({ id: tx.id, expenseId: c.id });
                                    }
                                    setMatchingId(null);
                                  }}
                                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-white"
                                >
                                  <span className="truncate text-gray-700">
                                    {tx.direction === "in" ? c.patientName ?? "—" : c.vendor ?? "—"} ·{" "}
                                    {(tx.direction === "in" ? c.paidAt : c.expenseDate)?.slice(0, 10)}
                                  </span>
                                  <span className="shrink-0 font-semibold text-gray-900">{c.amount} ₼</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DoctorDeskLayout>
  );
}
