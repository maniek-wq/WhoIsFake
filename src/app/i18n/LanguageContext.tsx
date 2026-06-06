import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, serverMessagePl, type Lang } from "./translations";

const LANG_KEY = "wif_lang";

type Vars = Record<string, string | number>;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (path: string, vars?: Vars) => string;
  /** localize a message that originated on the server (English) */
  ts: (message: string) => string;
}

const Ctx = createContext<LangCtx | null>(null);

function lookup(obj: unknown, path: string): string | undefined {
  const val = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
  return typeof val === "string" ? val : undefined;
}

function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

function detectInitial(): Lang {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === "pl" || saved === "en") return saved;
  return "pl"; // default Polish
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitial);

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggle = useCallback(() => setLangState((l) => (l === "pl" ? "en" : "pl")), []);

  const t = useCallback(
    (path: string, vars?: Vars) => {
      const hit = lookup(translations[lang], path) ?? lookup(translations.en, path) ?? path;
      return interpolate(hit, vars);
    },
    [lang]
  );

  const ts = useCallback(
    (message: string) => (lang === "pl" ? serverMessagePl[message] ?? message : message),
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, toggle, t, ts }), [lang, setLang, toggle, t, ts]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
