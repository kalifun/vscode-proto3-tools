import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

const WORD_RE = /[A-Za-z_][A-Za-z0-9_.]*/;

/** import "path"; 或 import public "path"; */
const IMPORT_RE = /\bimport\s+(?:public\s+|weak\s+)?"([^"]+)"\s*;/g;

const DEF_PATTERNS: { re: RegExp }[] = [
	{ re: /\bmessage\s+(\w+)\s*\{/g },
	{ re: /\benum\s+(\w+)\s*\{/g },
	{ re: /\bservice\s+(\w+)\s*\{/g },
	{ re: /\brpc\s+(\w+)\s*\(/g },
];

function offsetToPosition(fullText: string, offset: number): vscode.Position {
	const upTo = fullText.slice(0, offset);
	const lines = upTo.split('\n');
	const line = lines.length - 1;
	const character = lines[line].length;
	return new vscode.Position(line, character);
}

function stripLineCommentsForScan(line: string): string {
	return line.split('//')[0];
}

/**
 * 从文本中收集符号名 → 定义位置（同一文件内 uri）。
 * 行尾 // 注释不参与匹配，减少误匹配注释里的 message 等字样。
 */
function collectDefinitionsInText(text: string, uri: vscode.Uri): Map<string, vscode.Location> {
	const map = new Map<string, vscode.Location>();
	let idx = 0;
	while (idx < text.length) {
		const nl = text.indexOf('\n', idx);
		const lineEnd = nl === -1 ? text.length : nl;
		let raw = text.slice(idx, lineEnd);
		if (raw.endsWith('\r')) {
			raw = raw.slice(0, -1);
		}
		const line = stripLineCommentsForScan(raw);
		const lineStart = idx;

		for (const { re } of DEF_PATTERNS) {
			re.lastIndex = 0;
			let m: RegExpExecArray | null;
			while ((m = re.exec(line)) !== null) {
				const name = m[1];
				const nameInLine = m.index + m[0].indexOf(name);
				const start = lineStart + nameInLine;
				const endOff = start + name.length;
				const loc = new vscode.Location(
					uri,
					new vscode.Range(offsetToPosition(text, start), offsetToPosition(text, endOff))
				);
				map.set(name, loc);
			}
		}

		if (nl === -1) {
			break;
		}
		idx = nl + 1;
	}
	return map;
}

function extractImportPaths(text: string): string[] {
	const paths: string[] = [];
	let m: RegExpExecArray | null;
	IMPORT_RE.lastIndex = 0;
	while ((m = IMPORT_RE.exec(text)) !== null) {
		paths.push(m[1]);
	}
	return paths;
}

function resolveImportUri(fromDoc: vscode.TextDocument, importPath: string): vscode.Uri | undefined {
	if (fromDoc.uri.scheme !== 'file') {
		return undefined;
	}
	const dir = path.dirname(fromDoc.uri.fsPath);
	const full = path.normalize(path.join(dir, importPath));
	if (fs.existsSync(full) && fs.statSync(full).isFile()) {
		return vscode.Uri.file(full);
	}
	return undefined;
}

function lookupSymbol(
	map: Map<string, vscode.Location>,
	word: string
): vscode.Location | undefined {
	if (map.has(word)) {
		return map.get(word);
	}
	const dot = word.lastIndexOf('.');
	if (dot !== -1) {
		const tail = word.slice(dot + 1);
		return map.get(tail);
	}
	return undefined;
}

async function buildDefinitionMap(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<Map<string, vscode.Location>> {
	const merged = new Map<string, vscode.Location>();
	const body = document.getText();
	const imports = extractImportPaths(body);

	for (const imp of imports) {
		if (token.isCancellationRequested) {
			return merged;
		}
		const uri = resolveImportUri(document, imp);
		if (!uri) {
			continue;
		}
		try {
			const imported = await vscode.workspace.openTextDocument(uri);
			const part = collectDefinitionsInText(imported.getText(), imported.uri);
			for (const [k, v] of part) {
				if (!merged.has(k)) {
					merged.set(k, v);
				}
			}
		} catch {
			// 忽略无法打开的 import
		}
	}

	if (token.isCancellationRequested) {
		return merged;
	}
	const local = collectDefinitionsInText(body, document.uri);
	for (const [k, v] of local) {
		merged.set(k, v);
	}
	return merged;
}

export function createProto3DefinitionProvider(): vscode.DefinitionProvider {
	return {
		async provideDefinition(
			document: vscode.TextDocument,
			position: vscode.Position,
			token: vscode.CancellationToken
		): Promise<vscode.Location | vscode.Location[] | undefined> {
			const range = document.getWordRangeAtPosition(position, WORD_RE);
			if (!range) {
				return undefined;
			}
			const word = document.getText(range);
			if (!word) {
				return undefined;
			}

			const map = await buildDefinitionMap(document, token);
			const loc = lookupSymbol(map, word);
			return loc;
		},
	};
}
