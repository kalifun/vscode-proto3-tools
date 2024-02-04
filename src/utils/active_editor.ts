import vscode = require('vscode');

// 读取当前活跃的编辑窗口
export function readActiveEditor(): vscode.TextEditor | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showInformationMessage("Cannot generate markdown,No editor selected.");
        return;
    }

    if (!editor.document.fileName.endsWith(".proto")) {
        vscode.window.showInformationMessage("Cannot generate markdown. File in the editor is not a proto file.");
        return;
    }
    if (editor.document.isDirty) {
        vscode.window.showInformationMessage('File has unsaved changes. Save and try again.');
        return;
    }
    return editor;
}