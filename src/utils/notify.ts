import vscode = require('vscode');

// 展示生成文件成功的通知
export function showGenDocSucNotify(savePath: string) {
    vscode.window.showInformationMessage(
        "已将proto文件生成markdown了,存储的路径为:" + savePath
    );
}

export function showErrorNotify(err: NodeJS.ErrnoException) {
    vscode.window.showErrorMessage(
        err.message
    );
}

export function showInfoNotify(msg: string) {
    vscode.window.showInformationMessage(msg);
}
