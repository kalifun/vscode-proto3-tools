import fs = require("fs");
import vscode = require("vscode");
import compressing = require("compressing");
import request = require("https");
import path = require("path");
import { showErrorNotify, showInfoNotify } from "./notify";
import { download, downloadAndExtractTarGzFile } from "./download";

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
  const execPath =
    env === "win32"
      ? path.join(tool.winWorkSpace, tool.winBin)
      : path.join(tool.otherWorkSpace, tool.otherBin);
  return execPath;
}

// 展示安装工具通知
export function showInstallNotify(tool: ToolInfo) {
  const installTools = {
    title: "install",
    command: async (tool: ToolInfo) => {
      await installTool(tool);
      console.log("install proto-doc tool");
      return;
    },
  };
  vscode.window
    .showInformationMessage(
      "You should install proto-doc(https://github.com/kalifun/proto-doc)",
      installTools
    )
    .then((selection) => {
      if (selection) {
        selection.command(tool);
      }
    });
}

async function installTool(tool: ToolInfo) {
  let di = getToolInfo(tool);
  if (di === undefined) {
    showErrorNotify(Error("Get Tool Download Url Failed"));
    return;
  }

  if (fs.existsSync(di.workspace)) {
    console.log("Directory exists!");
    await downloadFile(di);
    await uncompress(di);
  } else {
    console.log("Directory not found.");
    fs.mkdir(di.workspace, { recursive: true }, (err) => {
      if (err) {
        console.log(err);
        throw err;
      } else {
        if (di !== undefined) {
          downloadFile(di);
        }
      }
    });
  }
}

export interface ToolInfo {
  name: string;
  winBin: string;
  winWorkSpace: string;
  otherBin: string;
  otherWorkSpace: string;
  version: string;
  repo: string;
}

export const protoDoc: string = "protoDoc";
const apiLinter: string = "apiLinter";

export const toolsMap: { [key: string]: ToolInfo } = {
  protoDoc: {
    name: "proto-doc",
    winBin: "proto-doc.exe",
    winWorkSpace: "C:\\Program Files\\proto3-tools\\bin\\",
    otherBin: "proto-doc",
    otherWorkSpace: "/usr/local/bin/",
    version: "0.1.4",
    repo: "https://github.com/kalifun/proto-doc",
  },
  apiLinter: {
    name: "api-linter",
    winBin: "api-linter.exe",
    winWorkSpace: "C:\\Program Files\\proto3-tools\\bin\\",
    otherBin: "api-linter",
    otherWorkSpace: "/usr/local/bin/",
    version: "",
    repo: "",
  },
};

export interface DownloadInfo {
  downloadpath: string;
  downloadurl: string;
  workspace: string;
  tarname: string;
}

// 关注arch
// https://github.com/kalifun/proto-doc/releases/download/v0.1.2/proto-doc_0.1.2_windows_amd64.tar.gz
function getToolInfo(tool: ToolInfo): DownloadInfo | undefined {
  // 下载路径
  let downloadPath = "";
  // 下载url
  let downloadUrl = "";

  let workspace = "";

  let tarname = "";

  const arch = getArch();
  if (arch === "") {
    // 需要返回
    return;
  }
  const suffix = ".tar.gz";
  const env = process.platform;
  switch (env) {
    case "win32":
      workspace = tool.winWorkSpace;
      tarname =
        tool.name + "_" + tool.version + "_" + "windows" + "_" + arch + suffix;
      downloadPath = tool.winWorkSpace + tarname;
      downloadUrl =
        tool.repo + "/releases/download/" + "v" + tool.version + "/" + tarname;
      break;
    case "linux":
      workspace = tool.otherWorkSpace;
      tarname =
        tool.name + "_" + tool.version + "_" + "linux" + "_" + arch + suffix;
      downloadPath = tool.otherWorkSpace + tarname;
      downloadUrl =
        tool.repo + "/releases/download/" + "v" + tool.version + "/" + tarname;
      break;
    case "darwin":
      workspace = tool.otherWorkSpace;
      tarname =
        tool.name + "_" + tool.version + "_" + "darwin" + "_" + arch + suffix;
      downloadPath = tool.otherWorkSpace + tarname;
      downloadUrl =
        tool.repo + "/releases/download/" + "v" + tool.version + "/" + tarname;
      break;
    default:
      return;
  }

  const d = {
    downloadpath: downloadPath,
    downloadurl: downloadUrl,
    workspace: workspace,
    tarname: tarname,
  };
  return d;
}

// get arch
function getArch(): string {
  const arch = process.arch;
  switch (arch) {
    case "x64":
      return "amd64";
    case "arm64":
      return arch;
    default:
      return "";
  }
}

export async function downloadFile(downloadInfo: DownloadInfo) {
  downloadAndExtractTarGzFile(downloadInfo)
    .then(() => {
      console.log("downloaded and extracted successfully.");
      deleteFile(downloadInfo.downloadpath);
    })
    .catch((err) => {
      console.error("Error downloading and extracting:", err);
    });
}

async function uncompress(downloadInfo: DownloadInfo) {
  compressing.tgz
    .uncompress(downloadInfo.downloadpath, downloadInfo.workspace)
    .then(() => {
      console.log("Decompression completed");
    })
    .catch((err) => {
      console.log(err.message);
      throw err;
    });
}

// delete file
function deleteFile(dest: string) {
  fs.unlink(dest, (err) => {
    if (err) {
      console.log("Failed to delete file");
      return;
    }
    console.log("File deletion completed");
  });
}
