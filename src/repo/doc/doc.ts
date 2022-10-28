import path = require('path');
import cp = require('child_process');
import vscode = require('vscode');
import { readActiveEditor } from '../../utils/active_editor';
import { execAreadyInstall, getExecPath, protoDoc, showInstallNotify, ToolInfo, toolsMap } from '../../utils/tools';
import { createDir } from '../../utils/dir';
import { showGenDocSucNotify } from '../../utils/notify';

// 操作时校验是否已安装工具
export function generateMarkdown(ctx: vscode.ExtensionContext) {
    const tool = getTool(protoDoc);
    if (!tool) {
        return;
    }
    const editor = readActiveEditor();
    if (!editor) {
        return;
    }
    editorToMarkDown(editor, tool);
}


export async function rightClickGenDoc(editor: vscode.TextEditor) {
    if (!editor) {
        vscode.window.showWarningMessage("Failed to get live window!");
    }
    const tool = getTool(protoDoc);
    if (!tool) {
        return;
    }
    editorToMarkDown(editor, tool);
}


function editorToMarkDown(editor: vscode.TextEditor, tool: ToolInfo) {
    // 文件路径
    const fileName = editor.document.fileName;
    const workDir = path.dirname(fileName);
    const execPath = getExecPath(tool);
    const config = vscode.workspace.getConfiguration('proto3');
    const docPath = config.get("outputpath");
    const outPath = path.join(workDir, String(docPath));
    const language = config.get("template_language");

    createDir(outPath);
    cp.execFile(execPath, ["doc",
        "--proto", fileName,
        "--out", outPath,
        "--language", String(language)], (error, stdout, stderr) => {
            if (error) {
                throw error;
            }
            console.log(stdout);
        });
    showGenDocSucNotify(outPath);
}

function getTool(toolName: string): ToolInfo | undefined {
    const tool = toolsMap[toolName];
    if (!execAreadyInstall(tool)) {
        showInstallNotify(tool);
        return undefined;
    }
    return tool;
}