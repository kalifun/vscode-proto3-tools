import * as vscode from "vscode";
import * as cp from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(cp.execFile);

let detectPromise: Promise<boolean> | undefined;
let cachedExecutable: string | undefined;
let warnedMissing = false;

function getConfiguredExecutable(): string {
    const config = vscode.workspace.getConfiguration("proto3");
    const fromConfig = config.get<string>("clang-format_executable");
    if (fromConfig && fromConfig.trim().length > 0) {
        return fromConfig.trim();
    }
    return "clang-format";
}

/**
 * 探测 clang-format 是否可执行。结果会缓存；配置或调用 resetClangFormatDetection 后会重新探测。
 */
export function detectClangFormat(force = false): Promise<boolean> {
    if (force) {
        detectPromise = undefined;
    }
    if (detectPromise) {
        return detectPromise;
    }
    const exe = getConfiguredExecutable();
    detectPromise = execFileAsync(exe, ["--version"], { timeout: 5000 })
        .then(() => {
            cachedExecutable = exe;
            return true;
        })
        .catch(() => {
            cachedExecutable = undefined;
            return false;
        });
    return detectPromise;
}

export function resetClangFormatDetection(): void {
    detectPromise = undefined;
    cachedExecutable = undefined;
    warnedMissing = false;
}

function warnMissingOnce(exe: string): void {
    if (warnedMissing) {
        return;
    }
    warnedMissing = true;
    void vscode.window.showWarningMessage(
        `Cannot find "${exe}". Install clang-format and ensure it is on PATH, or set "proto3.clang-format_executable".`
    );
}

/**
 * 执行 clang-format 并返回 TextEdit；调用方需保证 detectClangFormat() 已返回 true。
 */
export function formatFile(document: vscode.TextDocument): vscode.TextEdit[] {
    const config = vscode.workspace.getConfiguration("proto3");
    const basedOnStyle = config.get("clang-format_BasedOnStyle");
    const indentWidth = config.get("clang-format_IndentWidth");
    const tabWidth = config.get("clang-format_TabWidth");
    const exe = cachedExecutable ?? getConfiguredExecutable();
    const style = `{BasedOnStyle: ${basedOnStyle}, IndentWidth: ${indentWidth}, TabWidth: ${tabWidth}}`;

    try {
        const stdout = cp.execFileSync(exe, [`--style=${style}`], {
            input: document.getText(),
            maxBuffer: 10 * 1024 * 1024,
        });
        return [
            new vscode.TextEdit(
                document.validateRange(new vscode.Range(0, 0, Infinity, Infinity)),
                stdout ? stdout.toString() : ""
            ),
        ];
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        void vscode.window.showErrorMessage(`clang-format failed: ${msg}`);
        return [];
    }
}

export function createProto3DocumentFormattingProvider(): vscode.DocumentFormattingEditProvider {
    return {
        async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
            const ok = await detectClangFormat();
            if (!ok) {
                warnMissingOnce(getConfiguredExecutable());
                return [];
            }
            return formatFile(document);
        },
    };
}
