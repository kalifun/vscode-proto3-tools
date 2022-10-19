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
export function execAreadyInstall(tool: ToolInfo): boolean {
    return execFileExist(getExecPath(tool));
}

// 获取执行的路径
export function getExecPath(tool: ToolInfo): string {
    const env = process.platform;
    const execPath = env === 'win32' ? tool.winBin : tool.otherBin;
    return execPath;
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


export interface ToolInfo {
    name: string,
    winBin: string,
    otherBin: string
}

const protoDoc: string = "protoDoc";
const apiLinter: string = "apiLinter";

export const toolsMap: { [key: string]: ToolInfo } = {
    protoDoc: {
        name: 'proto-doc',
        winBin: 'C:\\Program Files\\proto3-tools\\bin\\proto-doc.exe',
        otherBin: '/usr/local/proto3-tools/bin/proto-doc'
    },
    apiLinter: {
        name: 'api-linter',
        winBin: 'C:\\Program Files\\proto3-tools\\bin\\api-linter.exe',
        otherBin: '/usr/local/proto3-tools/bin/api-linter'
    }
};

export { protoDoc, apiLinter };