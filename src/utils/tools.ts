import fs = require('fs');
import vscode = require('vscode');
import { createDir } from './dir';
import compressing = require('compressing');
import request = require("request");

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
            // 创建目录
            createDir("C:\\Program Files\\proto3-tools\\bin");
            // 下载工具
            downloadFile("https://github.com/kalifun/proto-doc/releases/download/v0.1.2/proto-doc_0.1.2_windows_amd64.tar.gz",
                "C:\\Program Files\\proto3-tools\\bin\\proto-doc_0.1.2_windows_amd64.tar.gz");
            console.log("install proto-doc tool");
            return;
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
    otherBin: string,
    version: string,
    repo: string,
}

const protoDoc: string = "protoDoc";
const apiLinter: string = "apiLinter";

export const toolsMap: { [key: string]: ToolInfo } = {
    protoDoc: {
        name: 'proto-doc',
        winBin: 'C:\\Program Files\\proto3-tools\\bin\\proto-doc.exe',
        otherBin: '/usr/local/proto3-tools/bin/proto-doc',
        version: "v0.1.2",
        repo: "https://github.com/kalifun/proto-doc"
    },
    apiLinter: {
        name: 'api-linter',
        winBin: 'C:\\Program Files\\proto3-tools\\bin\\api-linter.exe',
        otherBin: '/usr/local/proto3-tools/bin/api-linter',
        version: "",
        repo: ""
    }
};


export function downloadFile(uri: string, dest: string) {
    const file = fs.createWriteStream(dest);
    const sendReq = request.get(uri);

    // verify response code
    sendReq.on('response', (response) => {
        if (response.statusCode !== 200) {
            console.log('Response status was ' + response.statusCode);
            return;
        }
        sendReq.pipe(file);
    });

    // close() is async, call cb after close completes
    file.on('finish', () => {
        file.close();
        console.log("file download success");
        compressing.tgz.uncompress(dest, 'C:\\Program Files\\proto3-tools\\bin')
            .then(
                () => {
                    console.log("解压成功");
                    deleteFile(dest);
                }
            )
            .catch((err) => {
                console.log(err.message);
                deleteFile(dest);
            });
    });

    // check for request errors
    sendReq.on('error', (err) => {
        fs.unlink(dest, () => {
            console.log(err.message);

        }); // delete the (partial) file and then return the error
    });

    file.on('error', (err) => { // Handle errors
        fs.unlink(dest, () => {
            console.log(err.message);
        }); // delete the (partial) file and then return the error
    });
}


function deleteFile(dest: string) {
    fs.unlink(dest, (err) => {
        if (err) {
            console.log("文件删除失败");
            return;
        }
        console.log("文件删除完成");
    });
}



export { protoDoc, apiLinter }; 