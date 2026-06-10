import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  Database,
  Gauge,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Table2,
} from "lucide-react";
import { AboutModal } from "./AboutModal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { useAppStore } from "../../store/useAppStore";
import { cn } from "../../lib/cn";
import { normalizeLanguage, shellCopy } from "../../lib/i18n";

export type RouteId = "dashboard" | "models" | "sources" | "timeline" | "sessions" | "settings";

const navItems: Array<{ id: RouteId; icon: typeof Gauge }> = [
  { id: "dashboard", icon: Gauge },
  { id: "models", icon: BarChart3 },
  { id: "sources", icon: Database },
  { id: "timeline", icon: CalendarDays },
  { id: "sessions", icon: Table2 },
  { id: "settings", icon: Settings },
];

interface AppShellProps {
  activeRoute: RouteId;
  onRouteChange: (route: RouteId) => void;
  children: ReactNode;
}

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return localStorage.getItem("tokenscope-theme") === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("tokenscope-theme", theme);
  }, [theme]);

  return { theme, setTheme };
}

export function AppShell({ activeRoute, onRouteChange, children }: AppShellProps) {
  const { theme, setTheme } = useTheme();
  const range = useAppStore((state) => state.range);
  const query = useAppStore((state) => state.query);
  const setRange = useAppStore((state) => state.setRange);
  const setQuery = useAppStore((state) => state.setQuery);
  const loading = useAppStore((state) => state.loading);
  const events = useAppStore((state) => state.events);
  const settings = useAppStore((state) => state.settings);
  const language = normalizeLanguage(settings?.language);
  const copy = shellCopy[language];
  const totalTokens = useMemo(() => events.reduce((acc, event) => acc + event.total_tokens, 0), [events]);

  function navigate(route: RouteId) {
    window.location.hash = route;
    onRouteChange(route);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-panel/82 backdrop-blur-xl lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-border px-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/30 bg-accent/10">
              <Sparkles className="h-4 w-4 text-accent" aria-hidden />
            </div>
            <div>
              <div className="text-sm font-semibold">TokenScope</div>
              <div className="text-xs text-muted-foreground">
                {language === "zh" ? "本地用量分析" : "Local usage analytics"}
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeRoute;
              return (
                <button
                  key={item.id}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm transition",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                  onClick={() => navigate(item.id)}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {copy.nav[item.id]}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="h-3.5 w-3.5 text-accent" aria-hidden />
                {copy.indexedTokens}
              </div>
              <div className="mt-2 font-mono text-lg font-semibold">{totalTokens.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border bg-background/82 backdrop-blur-xl">
          <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="lg:hidden">
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/30 bg-accent/10">
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold">TokenScope</h1>
                <p className="truncate text-xs text-muted-foreground">{copy.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-52 flex-1 md:w-64 md:flex-none">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={copy.searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Select value={range} onChange={(event) => setRange(event.target.value as typeof range)}>
                <option value="today">{copy.ranges.today}</option>
                <option value="3d">{copy.ranges["3d"]}</option>
                <option value="7d">{copy.ranges["7d"]}</option>
                <option value="30d">{copy.ranges["30d"]}</option>
              </Select>
              <AboutModal />
              <Button
                variant="ghost"
                size="icon"
                title={theme === "dark" ? copy.themeLight : copy.themeDark}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {loading ? <div className="h-px bg-accent" /> : null}
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
