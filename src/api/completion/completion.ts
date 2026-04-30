import * as vscode from 'vscode';

const SCALAR_TYPES = [
	'double',
	'float',
	'int32',
	'int64',
	'uint32',
	'uint64',
	'sint32',
	'sint64',
	'fixed32',
	'fixed64',
	'sfixed32',
	'sfixed64',
	'bool',
	'string',
	'bytes',
];

const FILE_KEYWORDS = [
	'syntax',
	'package',
	'import',
	'option',
	'message',
	'enum',
	'service',
	'extend',
];

const FIELD_KEYWORDS = [
	'repeated',
	'optional',
	'map',
	'oneof',
	'reserved',
	'message',
	'enum',
];

const SERVICE_KEYWORDS = ['rpc', 'option', 'stream', 'returns'];

const WELL_KNOWN_TYPES = [
	'google.protobuf.Any',
	'google.protobuf.Timestamp',
	'google.protobuf.Duration',
	'google.protobuf.Empty',
	'google.protobuf.Struct',
	'google.protobuf.Value',
	'google.protobuf.ListValue',
	'google.protobuf.FieldMask',
	'google.protobuf.BoolValue',
	'google.protobuf.BytesValue',
	'google.protobuf.DoubleValue',
	'google.protobuf.FloatValue',
	'google.protobuf.Int32Value',
	'google.protobuf.Int64Value',
	'google.protobuf.StringValue',
	'google.protobuf.UInt32Value',
	'google.protobuf.UInt64Value',
];

type BlockKind = 'message' | 'enum' | 'service' | 'oneof';

function linePrefix(document: vscode.TextDocument, position: vscode.Position): string {
	return document.lineAt(position).text.substring(0, position.character);
}

function stripLineComment(line: string): string {
	return line.split('//')[0];
}

function advanceBlockScan(line: string, stack: BlockKind[]): void {
	const cleaned = stripLineComment(line);
	let idx = 0;
	while (idx < cleaned.length) {
		const rest = cleaned.slice(idx);
		const open = rest.match(/^\b(message|enum|service|oneof)\s+\w+\s*\{/);
		if (open) {
			stack.push(open[1] as BlockKind);
			idx += open[0].length;
			continue;
		}
		if (rest[0] === '}') {
			stack.pop();
			idx += 1;
			continue;
		}
		idx += 1;
	}
}

function getScopeStack(document: vscode.TextDocument, position: vscode.Position): BlockKind[] {
	const stack: BlockKind[] = [];
	for (let line = 0; line <= position.line; line++) {
		let text = document.lineAt(line).text;
		if (line === position.line) {
			text = text.substring(0, position.character);
		}
		advanceBlockScan(text, stack);
	}
	return stack;
}

function getDeclaredTypes(text: string): { messages: string[]; enums: string[] } {
	const messages: string[] = [];
	const enums: string[] = [];
	for (const m of text.matchAll(/\bmessage\s+(\w+)\s*\{/g)) {
		messages.push(m[1]);
	}
	for (const m of text.matchAll(/\benum\s+(\w+)\s*\{/g)) {
		enums.push(m[1]);
	}
	return {
		messages: [...new Set(messages)],
		enums: [...new Set(enums)],
	};
}

function kw(label: string, detail?: string): vscode.CompletionItem {
	const i = new vscode.CompletionItem(label, vscode.CompletionItemKind.Keyword);
	if (detail) {
		i.detail = detail;
	}
	return i;
}

function scalar(label: string): vscode.CompletionItem {
	return new vscode.CompletionItem(label, vscode.CompletionItemKind.TypeParameter);
}

function wellKnown(label: string): vscode.CompletionItem {
	const i = new vscode.CompletionItem(label, vscode.CompletionItemKind.Interface);
	i.detail = 'Well-known type';
	return i;
}

function addUserTypes(
	items: vscode.CompletionItem[],
	messages: string[],
	enums: string[]
): void {
	for (const name of messages) {
		const i = new vscode.CompletionItem(name, vscode.CompletionItemKind.Class);
		i.detail = 'message';
		items.push(i);
	}
	for (const name of enums) {
		const i = new vscode.CompletionItem(name, vscode.CompletionItemKind.Enum);
		i.detail = 'enum';
		items.push(i);
	}
}

function addRpcTypeItems(
	items: vscode.CompletionItem[],
	messages: string[],
	enums: string[]
): void {
	for (const t of WELL_KNOWN_TYPES) {
		items.push(wellKnown(t));
	}
	addUserTypes(items, messages, enums);
}

function syntaxProto3Completion(): vscode.CompletionItem[] {
	const i = new vscode.CompletionItem('proto3', vscode.CompletionItemKind.EnumMember);
	i.detail = 'syntax = "proto3"';
	return [i];
}

function isInsideUnclosedString(prefix: string): boolean {
	return ((prefix.match(/"/g) || []).length % 2) === 1;
}

export class Proto3CompletionItemProvider implements vscode.CompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
		if (token.isCancellationRequested) {
			return [];
		}

		const prefix = linePrefix(document, position);
		if (isInsideUnclosedString(prefix)) {
			if (/\bsyntax\s*=\s*"(\w*)$/.test(prefix)) {
				return syntaxProto3Completion();
			}
			return [];
		}

		const fullText = document.getText();
		const { messages, enums } = getDeclaredTypes(fullText);

		if (/\brpc\s+\w+\s*\(\s*([\w.]*)$/.test(prefix)) {
			const items: vscode.CompletionItem[] = [];
			addRpcTypeItems(items, messages, enums);
			return items;
		}
		if (/\breturns\s*\(\s*([\w.]*)$/.test(prefix)) {
			const items: vscode.CompletionItem[] = [];
			addRpcTypeItems(items, messages, enums);
			return items;
		}

		const stack = getScopeStack(document, position);
		const top = stack.length > 0 ? stack[stack.length - 1] : undefined;

		if (top === 'enum') {
			return [kw('reserved'), kw('option')];
		}

		if (top === 'service') {
			const items: vscode.CompletionItem[] = [];
			for (const w of SERVICE_KEYWORDS) {
				items.push(kw(w));
			}
			return items;
		}

		if (top === 'message' || top === 'oneof') {
			const items: vscode.CompletionItem[] = [];
			for (const w of FIELD_KEYWORDS) {
				items.push(kw(w));
			}
			for (const s of SCALAR_TYPES) {
				items.push(scalar(s));
			}
			for (const t of WELL_KNOWN_TYPES) {
				items.push(wellKnown(t));
			}
			addUserTypes(items, messages, enums);
			return items;
		}

		// File scope (or unknown nested): top-level declarations + types for imports / forward refs
		const items: vscode.CompletionItem[] = [];
		for (const w of FILE_KEYWORDS) {
			items.push(kw(w));
		}
		for (const t of WELL_KNOWN_TYPES) {
			items.push(wellKnown(t));
		}
		addUserTypes(items, messages, enums);
		return items;
	}
}
