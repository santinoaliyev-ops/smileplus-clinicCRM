import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import az from "./locales/az.json";
import ru from "./locales/ru.json";
import en from "./locales/en.json";

const STORAGE_KEY = "smileplus.lang";

i18n.use(initReactI18next).init({
  resources: {
    az: { translation: az },
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: localStorage.getItem(STORAGE_KEY) ?? "az",
  fallbackLng: "az",
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: "az" | "ru" | "en") {
  i18n.changeLanguage(lang);
  localStorage.setItem(STORAGE_KEY, lang);
}

export default i18n;