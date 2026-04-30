import path = require('path');
import cp = require('child_process');
import { promisify } from 'util';
import vscode = require('vscode');
import { readActiveEditor } from '../../utils/active_editor';
import { execAreadyInstall, getExecPath, protoDoc, showInstallNotify, ToolInfo, toolsMap } from '../../utils/tools';
import { createDir } from '../../utils/dir';
import { showGenDocSucNotify, showErrorNotify } from '../../utils/notify';

const execFileAsync = promisify(cp.execFile);

// 操作时校验是否已安装工具
export function generateMarkdown(_ctx: vscode.ExtensionContext) {
    const tool = getTool(protoDoc);
    if (!tool) {
        return;
    }
    const editor = readActiveEditor();
    if (!editor) {
        return;
    }
    void runEditorToMarkdown(editor, tool);
}


export async function rightClickGenDoc(editor: vscode.TextEditor | undefined) {
    if (!editor) {
        vscode.window.showWarningMessage("Failed to get live window!");
        return;
    }
    const tool = getTool(protoDoc);
    if (!tool) {
        return;
    }
    await runEditorToMarkdown(editor, tool);
}


async function runEditorToMarkdown(editor: vscode.TextEditor, tool: ToolInfo) {
    const fileName = editor.document.fileName;
    const workDir = path.dirname(fileName);
    const execPath = getExecPath(tool);
    const config = vscode.workspace.getConfiguration('proto3');
    const docPath = config.get("outputpath");
    const outPath = path.join(workDir, String(docPath));
    const language = config.get("template_language");

    try {
        await createDir(outPath);
    } catch {
        return;
    }

    try {
        const { stdout, stderr } = await execFileAsync(execPath, [
            "doc",
            "--proto", fileName,
            "--out", outPath,
            "--language", String(language),
        ]);
        if (stdout?.length) {
            console.log(stdout.toString());
        }
        if (stderr?.length) {
            console.warn(stderr.toString());
        }
        showGenDocSucNotify(outPath);
    } catch (error: unknown) {
        const err = error as NodeJS.ErrnoException & { stderr?: Buffer };
        const detail =
            (err.stderr && err.stderr.toString().trim()) || err.message || String(error);
        showErrorNotify(new Error(detail) as NodeJS.ErrnoException);
    }
}

function getTool(toolName: string): ToolInfo | undefined {
    const tool = toolsMap[toolName];
    if (!execAreadyInstall(tool)) {
        showInstallNotify(tool);
        return undefined;
    }
    return tool;
}