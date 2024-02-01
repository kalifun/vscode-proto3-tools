import https = require("https");
import fs = require("fs");
import { DownloadInfo } from "./tools";

export function downloadfile(downloadInfo: DownloadInfo) {
    const file = fs.createWriteStream(downloadInfo.downloadpath);
    https.get(downloadInfo.downloadurl, function (response) {
        response.pipe(file);
        file.on("finish", function(){
            file.close();
            console.log("File downloaded successfully.");
        });
    }).on("error", function(err) {
        // fs.unlink(downloadInfo.downloadpath);
        console.error('Error occurred while downloading file:', err);
    });
}   