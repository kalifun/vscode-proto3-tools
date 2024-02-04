import fs = require('fs');
import { showErrorNotify } from './notify';

export async function createDir(dirPath: string) {
    if (fs.existsSync(dirPath)) {
        console.log('Directory exists!');
    } else {
        console.log('Directory not found.');
        fs.mkdir(dirPath, { recursive: true }, err => {
            if (err) {
                showErrorNotify(err);
                throw err;
            }
            console.log('Directory is created.');
        });
    }
}