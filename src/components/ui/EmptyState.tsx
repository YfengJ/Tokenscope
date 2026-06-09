import type { ReactNode } from "react";
import { Database } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  body: string;
  action?: ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-panel/60 p-8 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted">
        <Database className="h-5 w-5 text-accent" aria-hidden />
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : <Button className="mt-5">Enable demo data</Button>}
    </div>
  );
}
