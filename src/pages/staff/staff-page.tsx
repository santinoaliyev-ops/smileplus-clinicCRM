import { useAuth } from "@/app/providers/auth/useAuth";
import { useStaff } from "@/features/staff/hooks/useStaff";

export default function StaffPage() {
  const { user } = useAuth();

  const { data: staff = [], isLoading } = useStaff(
    user?.clinicId ?? ""
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">
        Сотрудники
      </h1>

      <p className="mt-2 text-muted-foreground">
        Управление сотрудниками клиники
      </p>

      <div className="mt-8 rounded-lg border">
        <table className="w-full">
          <thead className="border-b">
            <tr className="text-left">
              <th className="p-4">ФИО</th>
              <th className="p-4">Email</th>
              <th className="p-4">Телефон</th>
              <th className="p-4">Роль</th>
              <th className="p-4">Статус</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center"
                >
                  Загрузка...
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center"
                >
                  Сотрудников пока нет
                </td>
              </tr>
            ) : (
              staff.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b"
                >
                  <td className="p-4">
                    {employee.fullName}
                  </td>

                  <td className="p-4">
                    {employee.email}
                  </td>

                  <td className="p-4">
                    {employee.phone}
                  </td>

                  <td className="p-4">
                    {employee.role}
                  </td>

                  <td className="p-4">
                    {employee.isActive
                      ? "Активен"
                      : "Неактивен"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}