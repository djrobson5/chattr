import { useSettings } from "@/lib/settings-context";
import { getTranslation } from "@/lib/translations";

export function useTranslation() {
  const { settings } = useSettings();

  function t(key: string): string {
    return getTranslation(key, settings.language, settings.uiInTargetLanguage);
  }

  return { t };
}
