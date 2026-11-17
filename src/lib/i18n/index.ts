import { I18N, I18N_LANG_NAMES } from "./dictionaries";
import type { ActionLabel, Block, ProcessKind } from "../types";

export { I18N, I18N_LANG_NAMES };

export const LANGS = Object.keys(I18N);
export const DEFAULT_LANG = LANGS.includes("it") ? "it" : LANGS[0] || "it";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  !!value && typeof value === "object";

export const dictionary = (lang: string): UnknownRecord => {
  const dict = (I18N as Record<string, unknown>)[lang];
  return isRecord(dict) ? dict : ((I18N as Record<string, unknown>)[DEFAULT_LANG] as UnknownRecord);
};

export const translate = (
  lang: string,
  key: string,
  vars?: Record<string, string | number>
): string => {
  const value = key.split(".").reduce<unknown>((node, part) => {
    return isRecord(node) ? node[part] : undefined;
  }, dictionary(lang));
  if (typeof value !== "string") return key;
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) =>
    vars[name] === undefined ? match : String(vars[name])
  );
};

export const phaseName = (lang: string, index: number): string => {
  const names = dictionary(lang).phases;
  return Array.isArray(names) && typeof names[index] === "string"
    ? names[index]
    : `Fase ${index + 1}`;
};

export const processName = (lang: string, kind: ProcessKind): string => {
  const names = dictionary(lang).processes;
  return isRecord(names) && typeof names[kind] === "string" ? names[kind] : kind;
};

export const stepText = (lang: string, block: Block): string => {
  const steps = dictionary(lang).steps;
  const value = isRecord(steps) ? steps[block.id] : undefined;
  return typeof value === "string" ? value : block.id;
};

export const actionLabel = (
  key: string,
  vars?: Record<string, string | number>
): ActionLabel => ({ key, vars });

export const labelText = (lang: string, value: ActionLabel | null | undefined): string => {
  if (typeof value === "string") return value;
  if (value && typeof value.key === "string") {
    return translate(lang, value.key, value.vars);
  }
  return "";
};

export const languageNames = (lang: string): Record<string, string> => {
  const names = (I18N_LANG_NAMES as Record<string, unknown>)[lang];
  return isRecord(names)
    ? (Object.fromEntries(
        Object.entries(names).filter((entry): entry is [string, string] => typeof entry[1] === "string")
      ) as Record<string, string>)
    : {};
};

export const nextLanguage = (lang: string): string => {
  const index = LANGS.indexOf(lang);
  return LANGS[(index + 1) % LANGS.length] || DEFAULT_LANG;
};

export const detectLanguage = (savedLang?: string): string => {
  try {
    const param = new URLSearchParams(window.location.search).get("lang");
    if (param && (I18N as Record<string, unknown>)[param]) return param;
  } catch {
    /* URL non leggibile */
  }
  if (savedLang && (I18N as Record<string, unknown>)[savedLang]) return savedLang;
  const candidates = (
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ""]
  ).map((code) => String(code).slice(0, 2).toLowerCase());
  return candidates.find((code) => (I18N as Record<string, unknown>)[code]) || DEFAULT_LANG;
};
