// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import cp = require('child_process');
import { Proto3CompletionItemProvider } from './api/completion/completion';
import { Proto3 } from './conf/config';
import { generateMarkdown, rightClickGenDoc } from './repo/doc/doc';



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// 注册一个自动补全
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(Proto3, new Proto3CompletionItemProvider(), '.', '\"'));

	function provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]> {
		let word = document.getText(document.getWordRangeAtPosition(position));
		console.log(word);
		console.log(position.line);

		let path = document.uri.path;
		return new vscode.Location(vscode.Uri.file(path), new vscode.Position(3, 10));
	}

	vscode.languages.registerDocumentFormattingEditProvider('proto3', {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			let filePath = document.uri.fsPath;
			let stdout = cp.execFileSync('clang-format', [filePath]);
			return [new vscode.TextEdit(document.validateRange(new vscode.Range(0, 0, Infinity, Infinity)), stdout ? stdout.toString() : '')];
		},
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('proto3.gendoc', generateMarkdown),
		vscode.commands.registerTextEditorCommand('proto3.menus_gendoc', editor => rightClickGenDoc(editor)),
		vscode.languages.registerDefinitionProvider(['proto3'], {
			provideDefinition
		}));
}




// this method is called when your extension is deactivated
export function deactivate() { }
