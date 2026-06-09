import { useState } from "react";
import { Github, Info, ShieldCheck, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Card, CardContent } from "../ui/Card";

const supportedSources = [
  "Codex CLI",
  "Claude Code",
  "Manual CSV",
  "Demo data",
  "OpenAI API config",
  "Anthropic API config",
];

export function AboutModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" title="About TokenScope" aria-label="About TokenScope" onClick={() => setOpen(true)}>
        <Info className="h-4 w-4" />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/72 p-4 backdrop-blur-md">
          <Card className="w-full max-w-2xl overflow-hidden shadow-glow">
            <CardContent className="p-0">
              <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">About TokenScope</h2>
                    <Badge tone="cyan">Version 0.1.0</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Local-first token analytics for AI coding tools.</p>
                </div>
                <Button variant="ghost" size="icon" title="Close" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShieldCheck className="h-4 w-4 text-accent" />
                    Data privacy statement
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    TokenScope does not store prompt or response content by default. It keeps token metadata,
                    timestamps, models, source names, and safe session references locally.
                  </p>
                </div>

                <div className="rounded-lg border border-border bg-background p-4">
                  <div className="text-sm font-medium">Open source</div>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <div>MIT License</div>
                    <a className="inline-flex items-center gap-2 text-accent hover:underline" href="https://github.com/YfengJ/Tokenscope/releases" target="_blank" rel="noreferrer">
                      <Github className="h-4 w-4" />
                      GitHub Releases
                    </a>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-background p-4 md:col-span-2">
                  <div className="text-sm font-medium">Supported sources</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {supportedSources.map((source) => (
                      <Badge key={source}>{source}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
