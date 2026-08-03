import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  patientsService,
  type PatientSearchResult,
} from "@/shared/api/patients/patients.service";

export function PatientSearchBox() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientSearchResult[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 3) {
      return;
    }
    const id = setTimeout(async () => {
      const q = query.trim();
      const isPhone = /^\+?\d{9,}$/.test(q.replace(/[\s-]/g, ""));
      try {
        if (isPhone) {
          const found = await patientsService.searchByPhone(
            q.replace(/[\s-]/g, "")
          );
          setResults(found ? [found] : []);
        } else {
          setResults(await patientsService.searchByName(q));
        }
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [query]);

  const visibleResults = query.trim().length < 3 ? [] : results;

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => visibleResults.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={t("doctorDesk.searchPatient")}
        className="w-56 rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-teal-500"
      />
      {open && visibleResults.length > 0 && (
        <div className="absolute z-50 mt-1 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {visibleResults.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setQuery("");
                setOpen(false);
                navigate(`/patient/${r.id}`);
              }}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-teal-50"
            >
              <span className="font-medium text-gray-800">
                {r.fullName ?? "—"}
              </span>
              <span className="text-xs text-gray-400">{r.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}