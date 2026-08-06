import { supabase } from "@/shared/lib/supabase";

export type PatientFileType = "photo" | "xray" | "ct" | "document";

export interface PatientFile {
  id: string;
  patientId: string;
  appointmentId: string | null;
  toothNumber: number | null;
  fileType: PatientFileType;
  title: string | null;
  url: string;
  storagePath: string;
  uploadedBy: string | null;
  createdAt: string;
}

export interface ClinicFileEntry extends PatientFile {
  patientName: string | null;
  patientPhone: string;
}

export interface UploadPatientFileInput {
  patientId: string;
  clinicId: string;
  uploadedBy: string;
  fileType: PatientFileType;
  file: File;
  toothNumber?: number | null;
  appointmentId?: string | null;
  title?: string | null;
}

const BUCKET = "patient-files";
const SIGNED_URL_TTL = 3600;

class PatientFilesService {
  async listByPatient(patientId: string): Promise<PatientFile[]> {
    const { data, error } = await supabase
      .from("patient_files")
      .select("id, patient_id, appointment_id, tooth_number, file_type, title, storage_path, uploaded_by, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) return [];

    const urlByPath = await this.signUrls(rows.map((r) => r.storage_path));

    return rows.map((row) => ({
      id: row.id,
      patientId: row.patient_id,
      appointmentId: row.appointment_id,
      toothNumber: row.tooth_number,
      fileType: row.file_type,
      title: row.title,
      url: urlByPath.get(row.storage_path) ?? "",
      storagePath: row.storage_path,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
    }));
  }

  /** Все файлы клиники (раздел «Документы» у администратора), не только одного пациента */
  async listByClinic(clinicId: string, limit = 200): Promise<ClinicFileEntry[]> {
    const { data, error } = await supabase
      .from("patient_files")
      .select(
        "id, patient_id, appointment_id, tooth_number, file_type, title, storage_path, uploaded_by, created_at, users:patient_id ( full_name, phone )"
      )
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    const rows = data ?? [];
    if (rows.length === 0) return [];

    const urlByPath = await this.signUrls(rows.map((r) => r.storage_path));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return rows.map((row: any) => ({
      id: row.id,
      patientId: row.patient_id,
      patientName: row.users?.full_name ?? null,
      patientPhone: row.users?.phone ?? "",
      appointmentId: row.appointment_id,
      toothNumber: row.tooth_number,
      fileType: row.file_type,
      title: row.title,
      url: urlByPath.get(row.storage_path) ?? "",
      storagePath: row.storage_path,
      uploadedBy: row.uploaded_by,
      createdAt: row.created_at,
    }));
  }

  private async signUrls(paths: string[]): Promise<Map<string, string>> {
    if (paths.length === 0) return new Map();
    const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    return new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  }

  async upload(input: UploadPatientFileInput): Promise<void> {
    const ext = input.file.name.split(".").pop() ?? "bin";
    const path = `${input.clinicId}/${input.patientId}/${input.fileType}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, input.file);
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("patient_files").insert({
      patient_id: input.patientId,
      clinic_id: input.clinicId,
      appointment_id: input.appointmentId ?? null,
      tooth_number: input.toothNumber ?? null,
      file_type: input.fileType,
      title: input.title ?? input.file.name,
      storage_path: path,
      uploaded_by: input.uploadedBy,
    });

    if (insertError) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw insertError;
    }
  }

  async remove(id: string, storagePath: string): Promise<void> {
    const { error } = await supabase.from("patient_files").delete().eq("id", id);
    if (error) throw error;
    await supabase.storage.from(BUCKET).remove([storagePath]);
  }
}

export const patientFilesService = new PatientFilesService();
