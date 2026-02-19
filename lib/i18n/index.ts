/**
 * BAYSIS i18n — Lightweight internationalization system
 *
 * Usage:
 *   import { useTranslation } from "@/lib/i18n";
 *   const { t } = useTranslation();
 *   <Text>{t("home.discover")}</Text>
 */

import { useLanguageStore } from "@/lib/store";
import en from "./en";
import ar from "./ar";

const translations: Record<string, Record<string, any>> = { en, ar };

/** Resolve nested key: t("home.title") => translations[lang].home.title */
function resolve(obj: any, path: string): string {
    const keys = path.split(".");
    let current = obj;
    for (const key of keys) {
        if (current == null || typeof current !== "object") return path;
        current = current[key];
    }
    return typeof current === "string" ? current : path;
}

/** Hook that returns t() function and current language info */
export function useTranslation() {
    const { resolvedLanguage } = useLanguageStore();
    const lang = resolvedLanguage;
    const dict = translations[lang] || translations.en;

    const t = (key: string, params?: Record<string, string | number>): string => {
        let text = resolve(dict, key);
        // Fallback to English if key missing
        if (text === key && lang !== "en") {
            text = resolve(translations.en, key);
        }
        // Simple {{param}} interpolation
        if (params && text !== key) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(new RegExp(`{{${k}}}`, "g"), String(v));
            });
        }
        return text;
    };

    return { t, language: lang, isRTL: lang === "ar" };
}

/** Non-hook version for use outside components */
export function t(key: string, params?: Record<string, string | number>): string {
    const { resolvedLanguage } = useLanguageStore.getState();
    const dict = translations[resolvedLanguage] || translations.en;
    let text = resolve(dict, key);
    if (text === key && resolvedLanguage !== "en") {
        text = resolve(translations.en, key);
    }
    if (params && text !== key) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        });
    }
    return text;
}
