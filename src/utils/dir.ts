import fs = require('fs');

export function createDir(dirPath: string) {
    if (fs.existsSync(dirPath)) {
        console.log('Directory exists!');
    } else {
        console.log('Directory not found.');
        fs.mkdir(dirPath, err => {
            if (err) {
                throw err;
            }
            console.log('Directory is created.');
        });
    }
}