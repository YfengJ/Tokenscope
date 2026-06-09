import { useEffect, useMemo, useState } from "react";
import { AppShell, type RouteId } from "./components/layout/AppShell";
import { Dashboard } from "./routes/Dashboard";
import { Models } from "./routes/Models";
import { Sources } from "./routes/Sources";
import { Timeline } from "./routes/Timeline";
import { Sessions } from "./routes/Sessions";
import { Settings } from "./routes/Settings";
import { useAppStore } from "./store/useAppStore";

function readInitialRoute(): RouteId {
  const hash = window.location.hash.replace("#", "");
  if (["dashboard", "models", "sources", "timeline", "sessions", "settings"].includes(hash)) {
    return hash as RouteId;
  }
  return "dashboard";
}

export default function App() {
  const [route, setRoute] = useState<RouteId>(readInitialRoute);
  const load = useAppStore((state) => state.load);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onHash = () => setRoute(readInitialRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const page = useMemo(() => {
    switch (route) {
      case "models":
        return <Models />;
      case "sources":
        return <Sources />;
      case "timeline":
        return <Timeline />;
      case "sessions":
        return <Sessions />;
      case "settings":
        return <Settings />;
      case "dashboard":
      default:
        return <Dashboard />;
    }
  }, [route]);

  return (
    <AppShell activeRoute={route} onRouteChange={setRoute}>
      {page}
    </AppShell>
  );
}
