import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(root, path), "utf8")) as T;
}

function lineCount(path: string) {
  return readFileSync(join(root, path), "utf8").split(/\r?\n/).length;
}

describe("release configuration", () => {
  it("configures Tauri identity, version, bundle targets, and icons", () => {
    const pkg = readJson<{ version: string }>("package.json");
    const config = readJson<{
      productName: string;
      version: string;
      identifier: string;
      bundle: { active: boolean; targets: string; icon: string[]; macOS?: unknown; windows?: unknown };
    }>("src-tauri/tauri.conf.json");

    expect(config.productName).toBe("TokenScope");
    expect(config.version).toBe(pkg.version);
    expect(config.identifier).toBe("com.tokenscope.desktop");
    expect(config.bundle.active).toBe(true);
    expect(config.bundle.targets).toBe("all");
    expect(config.bundle.icon).toEqual(
      expect.arrayContaining([
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico",
      ]),
    );
    expect(config.bundle.macOS).toBeTruthy();
    expect(config.bundle.windows).toBeTruthy();
  });

  it("includes generated icon assets and source artwork", () => {
    for (const file of [
      "src-tauri/icons/icon.svg",
      "src-tauri/icons/32x32.png",
      "src-tauri/icons/128x128.png",
      "src-tauri/icons/128x128@2x.png",
      "src-tauri/icons/icon.icns",
      "src-tauri/icons/icon.ico",
    ]) {
      expect(existsSync(join(root, file)), `${file} should exist`).toBe(true);
    }
  });

  it("configures release workflow for tags, manual dispatch, macOS, and Windows", () => {
    const workflow = readFileSync(join(root, ".github/workflows/release.yml"), "utf8");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("tag_name:");
    expect(workflow).toContain('"v*"');
    expect(workflow).toContain("macos-arm64");
    expect(workflow).toContain("macos-x64");
    expect(workflow).toContain("windows-x64");
    expect(workflow).toContain("tauri-apps/tauri-action@v0");
    expect(workflow).toContain("contents: write");
    expect(workflow).toContain("releaseDraft: true");
    expect(workflow).toContain("DMG");
    expect(workflow).toContain("MSI/NSIS");
    expect(workflow).toContain("unsigned");
    expect(workflow).toContain("notarization");
    expect(workflow).toContain("code signing");
  });

  it("documents release install, source status, privacy, accuracy, and unsigned build guidance", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8");
    const release = readFileSync(join(root, "RELEASE.md"), "utf8");

    expect(readme).toContain("Install from Release");
    expect(readme).toContain("Implemented in 0.1.0");
    expect(readme).toContain("UI scaffold / planned");
    expect(readme).toContain("Experimental Codex local log parser");
    expect(readme).toContain("Experimental Claude Code local log parser");
    expect(readme).toContain("Estimated cost is approximate");
    expect(readme).toContain("Accuracy depends on source");
    expect(readme).toContain("TokenScope does not store prompt or response content by default");
    expect(readme).toContain("API connectors are not fully implemented in 0.1.0");
    expect(readme).toContain("Dashboard");
    expect(readme).toContain("Sources");
    expect(readme).toContain("Sessions");
    expect(readme).toContain("Settings");
    expect(readme).toContain(".dmg");
    expect(readme).toContain(".msi");
    expect(readme).toContain("unsigned");
    expect(release).toContain("git tag v0.1.0");
    expect(release).toContain("workflow_dispatch");
    expect(release).toContain("Open TokenScope.app");
    expect(release).toContain("Confirm About shows version 0.1.0");
    expect(release).toContain("macOS notarization");
    expect(release).toContain("Windows code signing");
  });

  it("keeps release version references aligned", () => {
    const pkg = readJson<{ version: string }>("package.json");
    const config = readJson<{ version: string }>("src-tauri/tauri.conf.json");
    const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
    const release = readFileSync(join(root, "RELEASE.md"), "utf8");

    expect(pkg.version).toBe("0.1.0");
    expect(config.version).toBe(pkg.version);
    expect(changelog).toContain(`## ${pkg.version}`);
    expect(release).toContain(`v${pkg.version}`);
  });

  it("keeps public markdown and workflow files readable", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8");
    const zhReadme = readFileSync(join(root, "README.zh-CN.md"), "utf8");
    const ciWorkflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
    const releaseWorkflow = readFileSync(join(root, ".github/workflows/release.yml"), "utf8");

    expect(lineCount("README.md")).toBeGreaterThan(50);
    expect(lineCount("README.zh-CN.md")).toBeGreaterThan(40);
    expect(lineCount(".github/workflows/ci.yml")).toBeGreaterThan(20);
    expect(lineCount(".github/workflows/release.yml")).toBeGreaterThan(35);
    expect(readme).toContain("| Source | Status | Type | Accuracy |");
    expect(zhReadme).toContain("| 数据源 | 状态 | 类型 | 准确性 |");
    expect(releaseWorkflow).toContain("releaseDraft: true");
    expect(releaseWorkflow).toContain("workflow_dispatch:");
    expect(ciWorkflow).toContain("pnpm typecheck");
  });
});
