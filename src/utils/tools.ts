import fs = require('fs');
import vscode = require('vscode');

// 判断文件是否存在
export function execFileExist(filePath: string): boolean {
    let exist = true;
    try {
        exist = fs.statSync(filePath).isFile();
        if (exist) {
            fs.accessSync(filePath, fs.constants.F_OK | fs.constants.X_OK);
        }
    } catch (e) {
        exist = false;
    }
    return exist;
}

// 判断当前机器环境获取执行路径
export function execAreadyInstall(): boolean {
    const env = process.platform;
    const execPath = env === 'win32' ? "C:\\Program Files\\proto3-tools\\bin\\proto-doc.exe" : "/usr/local/proto3-tools/bin/proto-doc";
    return execFileExist(execPath);
}

// 展示安装工具通知
export function showInstallNotify() {
    const installTools = {
        title: "install",
        command: () => {
            console.log("install proto-doc tool");
        }
    };
    vscode.window.showInformationMessage(
        "You should install proto-doc(https://github.com/kalifun/proto-doc)",
        installTools
    ).then((selection) => {
        if (selection) {
            selection.command();
        }
    });
}