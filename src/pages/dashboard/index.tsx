import { useAuth } from "@/app/providers/auth";
import { useClinic } from "@/app/providers/clinic";
import { ROLE_LABELS } from "@/shared/types/auth";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { clinic } = useClinic();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {clinic?.clinicName ?? "Клиника не выбрана"}
          </h1>
          <button
            onClick={logout}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
          >
            Выйти
          </button>
        </div>

        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">Сотрудник:</span>{" "}
            {user?.account.fullName}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user?.account.email}
          </p>
          <p>
            <span className="font-medium">Роль:</span>{" "}
            {clinic ? ROLE_LABELS[clinic.role] : "—"}
          </p>
          <p>
            <span className="font-medium">Клиник в доступе:</span>{" "}
            {user?.clinics.length ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}