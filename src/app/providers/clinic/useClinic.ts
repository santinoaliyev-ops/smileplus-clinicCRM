import { useContext } from "react";
import { ClinicContext } from "./ClinicContext";

export function useClinic() {
  const context = useContext(ClinicContext);

  if (!context) {
    throw new Error("useClinic must be used inside ClinicProvider");
  }

  return context;
}