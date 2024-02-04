import * as vscode from "vscode";
import cp = require('child_process');

export function isClangFormat(): Boolean {
  const childProcess = require("child_process");
  childProcess.exec(
    "clang-format --version",
    (error: any, stdout: any, stderr: any) => {
      if (error) {
        vscode.window.showWarningMessage(
          "Clang-Format is not installed, Please format it after installation."
        );
        return false;
      } else {
        //   vscode.window.showInformationMessage("Clang-Format is installed.");
        return true;
      }
    }
  );
  return false;
}


export function formatFile(document: vscode.TextDocument): vscode.TextEdit[]{
    const config = vscode.workspace.getConfiguration('proto3');
    const basedOnStyle = config.get("clang-format_BasedOnStyle");
    const indentWith = config.get("clang-format_IndentWidth");
    const tabWith = config.get("clang-format_TabWidth");
    let cmd = `clang-format --style="{BasedOnStyle: ${basedOnStyle}, IndentWidth: ${indentWith}, TabWidth: ${tabWith}}"`;
    // console.log(cmd);
    let stdout = cp.execSync(cmd, {input: document.getText()});
    // console.log(stdout.toString());
	return [new vscode.TextEdit(document.validateRange(new vscode.Range(0, 0, Infinity, Infinity)), stdout ? stdout.toString() : '')];
}