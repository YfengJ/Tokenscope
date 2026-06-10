import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AboutModal } from "../components/layout/AboutModal";

describe("AboutModal", () => {
  it("shows version, license, privacy, sources, and release link", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version: string };
    render(<AboutModal />);
    fireEvent.click(screen.getByRole("button", { name: "About TokenScope" }));

    expect(screen.getByText(`Version ${pkg.version}`)).toBeInTheDocument();
    expect(screen.getByText("MIT License")).toBeInTheDocument();
    expect(screen.getByText(/does not store prompt or response content/i)).toBeInTheDocument();
    expect(screen.getByText("Codex CLI")).toBeInTheDocument();
    expect(screen.getByText("GitHub Releases")).toBeInTheDocument();
  });

  it("can be dismissed without restarting the app", () => {
    render(<AboutModal />);
    fireEvent.click(screen.getByRole("button", { name: "About TokenScope" }));

    expect(screen.getByRole("dialog", { name: "About TokenScope" })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("about-modal-backdrop"));
    expect(screen.queryByRole("dialog", { name: "About TokenScope" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "About TokenScope" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "About TokenScope" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "About TokenScope" }));
    act(() => {
      window.dispatchEvent(new Event("hashchange"));
    });
    expect(screen.queryByRole("dialog", { name: "About TokenScope" })).not.toBeInTheDocument();
  });
});
