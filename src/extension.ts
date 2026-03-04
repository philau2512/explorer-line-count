import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// ─── Config (loaded from settings.json) ───────────────────────────────────────

interface ExtConfig {
  allowedExtensions: Set<string>;
  ignoredFolders: Set<string>;
  maxFileSize: number;      // bytes
  minLineDisplay: number;   // badge hidden if lines < this
}

let cfg: ExtConfig = loadConfig();

function loadConfig(): ExtConfig {
  const c = vscode.workspace.getConfiguration("explorerLineCount");

  const exts: string[] = c.get("allowedExtensions", [
    ".ts", ".tsx", ".js", ".jsx", "mjs", ".dart", ".py",
    ".java", ".go", ".rs", ".cpp", ".c", ".h",
    ".json", ".yaml", ".yml", ".html", ".css", ".scss",
    ".md", ".sql", ".sh",
  ]);

  const folders: string[] = c.get("ignoredFolders", [
    "node_modules", ".git", "dist", "build",
    ".dart_tool", ".idea", ".vscode",
  ]);

  const maxMB: number = c.get("maxFileSize", 2);
  const minLines: number = c.get("minLineDisplay", 0);

  return {
    allowedExtensions: new Set(exts),
    ignoredFolders: new Set(folders),
    maxFileSize: maxMB * 1024 * 1024,
    minLineDisplay: minLines,
  };
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const MAX_LINES = 10_000;
type CacheEntry = { lines: number } | { tooLarge: true };
const lineCache = new Map<string, CacheEntry>();
const pending = new Set<string>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shouldIgnore(uri: vscode.Uri): boolean {
  const filePath = uri.fsPath;
  const ext = path.extname(filePath);

  if (!cfg.allowedExtensions.has(ext)) {
    return true;
  }

  for (const folder of cfg.ignoredFolders) {
    if (filePath.includes(path.sep + folder + path.sep)) {
      return true;
    }
  }

  return false;
}

async function countLinesAsync(filePath: string): Promise<CacheEntry | null> {
  try {
    const stat = await fs.promises.stat(filePath);

    if (stat.size > cfg.maxFileSize) {
      return { tooLarge: true };
    }

    const content = await fs.promises.readFile(filePath, "utf8");
    const lines = content.split(/\r?\n/).length;
    return { lines: Math.min(lines, MAX_LINES) };
  } catch {
    return null;
  }
}

function formatBadge(lines: number): string {
  if (lines >= 10000) {
    return "9k";
  }
  if (lines >= 1000) {
    return Math.floor(lines / 1000) + "k";
  }
  if (lines >= 100) {
    return Math.floor(lines / 100) + "h";
  }
  return String(lines);
}

// ─── Decoration Provider ──────────────────────────────────────────────────────

class LineDecorationProvider implements vscode.FileDecorationProvider {
  private _onDidChangeFileDecorations = new vscode.EventEmitter<
    vscode.Uri | vscode.Uri[]
  >();

  readonly onDidChangeFileDecorations =
    this._onDidChangeFileDecorations.event;

  fire(uri: vscode.Uri | vscode.Uri[]) {
    this._onDidChangeFileDecorations.fire(uri);
  }

  provideFileDecoration(
    uri: vscode.Uri
  ): vscode.ProviderResult<vscode.FileDecoration> {

    if (uri.scheme !== "file") {
      return;
    }

    if (shouldIgnore(uri)) {
      return;
    }

    const filePath = uri.fsPath;

    // If already cached → return immediately
    const cached = lineCache.get(filePath);
    if (cached !== undefined) {
      if ("tooLarge" in cached) {
        return {
          badge: " ", // using space to ensure UI picks it up without looking too bad
          tooltip: `File limit exceeded (> ${Math.round(cfg.maxFileSize / (1024 * 1024))}MB)`,
        };
      }

      // minLineDisplay filter: hide badge but tooltip still works
      if (cached.lines < cfg.minLineDisplay) {
        return {
          badge: " ", // space ensures the tooltip behaves properly when hovered
          tooltip: `${cached.lines} lines`,
        };
      }
      return {
        badge: formatBadge(cached.lines),
        tooltip: `${cached.lines} lines`,
      };
    }

    // If not pending yet → read async, then fire to trigger a refresh
    if (!pending.has(filePath)) {
      pending.add(filePath);

      countLinesAsync(filePath).then((result) => {
        pending.delete(filePath);

        if (result !== null) {
          lineCache.set(filePath, result);
          this._onDidChangeFileDecorations.fire(uri);
        }
      });
    }

    // Return undefined for now — VS Code will call again after the fire event
    return undefined;
  }
}

// ─── Activate ─────────────────────────────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {

  const provider = new LineDecorationProvider();

  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(provider)
  );

  // ── Listen for settings changes ──────────────────────────────────────────
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("explorerLineCount")) {
        return;
      }

      // Debounce 300ms to avoid rapid refreshes when user edits multiple settings
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        cfg = loadConfig();

        // Batch fire: collect all cached URIs and fire once
        const uris = [...lineCache.keys()].map((p) => vscode.Uri.file(p));
        lineCache.clear();
        pending.clear();

        if (uris.length > 0) {
          provider.fire(uris);
        }
      }, 300);
    })
  );

  // ── File events ──────────────────────────────────────────────────────────
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (shouldIgnore(doc.uri)) {
        return;
      }

      lineCache.set(doc.uri.fsPath, { lines: doc.lineCount });
      provider.fire(doc.uri);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidDeleteFiles((e) => {
      for (const f of e.files) {
        lineCache.delete(f.fsPath);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles((e) => {
      for (const f of e.files) {
        lineCache.delete(f.oldUri.fsPath);
      }
    })
  );
}

export function deactivate() {}