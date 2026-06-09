import type { AppSettings } from "./types";

export type Language = AppSettings["language"];

export const languageLabels: Record<Language, string> = {
  en: "English",
  zh: "中文",
};

export const shellCopy: Record<
  Language,
  {
    subtitle: string;
    searchPlaceholder: string;
    indexedTokens: string;
    ranges: Record<string, string>;
    nav: Record<string, string>;
    themeLight: string;
    themeDark: string;
  }
> = {
  en: {
    subtitle: "Token metadata, local logs, model mix, and estimated cost.",
    searchPlaceholder: "Search model, source, project",
    indexedTokens: "Indexed tokens",
    ranges: {
      today: "Today",
      "3d": "3 days",
      "7d": "7 days",
      "30d": "30 days",
    },
    nav: {
      dashboard: "Dashboard",
      models: "Models",
      sources: "Sources",
      timeline: "Timeline",
      sessions: "Sessions",
      settings: "Settings",
    },
    themeLight: "Switch to light mode",
    themeDark: "Switch to dark mode",
  },
  zh: {
    subtitle: "Token 元数据、本地日志、模型分布和预估费用。",
    searchPlaceholder: "搜索模型、来源、项目",
    indexedTokens: "已索引 tokens",
    ranges: {
      today: "今天",
      "3d": "3 天",
      "7d": "7 天",
      "30d": "30 天",
    },
    nav: {
      dashboard: "仪表盘",
      models: "模型",
      sources: "数据源",
      timeline: "时间线",
      sessions: "会话",
      settings: "设置",
    },
    themeLight: "切换到浅色模式",
    themeDark: "切换到深色模式",
  },
};

export function normalizeLanguage(language: string | null | undefined): Language {
  return language === "zh" ? "zh" : "en";
}
