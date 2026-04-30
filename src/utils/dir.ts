import fs = require('fs');
import { showErrorNotify } from './notify';

/** 创建目录；失败时已提示，Promise reject 供调用方选择是否中断流程 */
export function createDir(dirPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		if (fs.existsSync(dirPath)) {
			resolve();
			return;
		}
		fs.mkdir(dirPath, { recursive: true }, (err) => {
			if (err) {
				showErrorNotify(err);
				reject(err);
				return;
			}
			resolve();
		});
	});
}