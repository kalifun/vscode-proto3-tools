import path = require('path');
import vscode = require('vscode');
import { readActiveEditor } from '../../utils/active_editor';
import { execAreadyInstall, showInstallNotify } from '../../utils/tools';


// 操作时校验是否已安装工具
export function generateMarkdown(ctx: vscode.ExtensionContext) {
    if (!execAreadyInstall()) {
        return showInstallNotify();
    }
    const editor = readActiveEditor();
    if (!editor) {
        return;
    }
    const fileName = editor.document.fileName;
    const workDir = path.dirname(fileName);
    console.log(workDir);
    
}
