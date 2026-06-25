import * as assert from "assert";
import * as vscode from "vscode";
import { formatBadge, formatBytes } from "../extension";

// ─── formatBadge ─────────────────────────────────────────────────────────────

suite("formatBadge", () => {
  const cases: [number, string][] = [
    [0,      "0"],
    [1,      "1"],
    [99,     "99"],
    [100,    "1h"],
    [550,    "5h"],
    [999,    "9h"],
    [1000,   "1k"],
    [5500,   "5k"],
    [9999,   "9k"],
    [10000,  "9k"],   // capped at "9k"
    [99999,  "9k"],
  ];

  for (const [input, expected] of cases) {
    test(`${input} → "${expected}"`, () => {
      assert.strictEqual(formatBadge(input), expected);
    });
  }
});

// ─── formatBytes ─────────────────────────────────────────────────────────────

suite("formatBytes", () => {
  const cases: [number, string][] = [
    [0,         "0B"],
    [1,         "1B"],
    [512,       "512B"],
    [1023,      "1023B"],
    [1024,      "1KB"],
    [1536,      "1.5KB"],
    [1048576,   "1MB"],
    [2621440,   "2.5MB"],
  ];

  for (const [input, expected] of cases) {
    test(`${input} bytes → "${expected}"`, () => {
      assert.strictEqual(formatBytes(input), expected);
    });
  }
});

// ─── Extension smoke tests ────────────────────────────────────────────────────

suite("Extension", () => {
  test("activates without error", async () => {
    const ext = vscode.extensions.getExtension("philau2512.explorer-line-count");
    assert.ok(ext, "Extension should be present in the Extension Host");
    await ext!.activate();
    assert.strictEqual(ext!.isActive, true, "Extension should be active after activate()");
  });

  test("registers a FileDecorationProvider on activation", async () => {
    // Indirect proof: if the provider threw during registration VS Code would
    // reject the subscription and isActive would be false.
    const ext = vscode.extensions.getExtension("philau2512.explorer-line-count");
    await ext?.activate();
    assert.ok(ext?.isActive, "Provider registration must not throw");
  });
});
