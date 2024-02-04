import * as https from "https";
import fs = require("fs");
import { DownloadInfo } from "./tools";
import { showErrorNotify } from "./notify";
import * as tar from "tar";

export async function download(downloadInfo: DownloadInfo) {
  https
    .get(downloadInfo.downloadurl, function (response) {
      if (response.statusCode !== 200 && response.statusCode !== 302) {
        let msg = "Response status was " + response.statusCode;
        // console.log(msg);
        showErrorNotify(Error(msg));
        return;
      }
      if (response.statusCode === 302) {
        let location = response.headers.location;
        if (location === undefined) {
          showErrorNotify(Error("get location failed"));
          return;
        } else {
          let newPath = downloadInfo;
          newPath.downloadurl = location;
          download(newPath);
          return;
        }
      }
      const file = fs.createWriteStream(downloadInfo.downloadpath);
      response.pipe(file);
      file.on("finish", function () {
        file.close();
        console.log("File downloaded successfully.");
      });
    })
    .on("error", function (err) {
      // fs.unlink(downloadInfo.downloadpath);
      console.error("Error occurred while downloading file:", err);
      throw err;
    });
}


export function downloadAndExtractTarGzFile(
  downloadInfo: DownloadInfo
): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(downloadInfo.downloadurl, (response) => {
      if (response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl === undefined) {
          showErrorNotify(Error("get location failed"));
          return;
        } else {
          let newDInfo = downloadInfo;
          newDInfo.downloadurl = redirectUrl;
          return downloadAndExtractTarGzFile(newDInfo)
            .then(() => {
              resolve();
            })
            .catch((err) => {
              reject(err);
            });
        }
      } else {
        const file = fs.createWriteStream(downloadInfo.downloadpath);
        response.pipe(file);
        file.on("finish", () => {
          fs.createReadStream(downloadInfo.downloadpath)
            .pipe(
              tar.extract({
                cwd: downloadInfo.workspace,
              })
            )
            .on("finish", () => {
              resolve();
            })
            .on("error", (err) => {
              reject(err);
            });
        });

        file.on("error", (err) => {
          reject(err);
        });
      }
    });
  });
}
