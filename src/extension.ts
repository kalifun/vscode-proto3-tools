// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Proto3CompletionItemProvider } from './api/completion/completion';
import { createProto3DefinitionProvider } from './api/definition/protoDefinition';
import { Proto3 } from './conf/config';
import { generateMarkdown, rightClickGenDoc } from './repo/doc/doc';
import {
	createProto3DocumentFormattingProvider,
	detectClangFormat,
	resetClangFormatDetection,
} from './repo/format/format';



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// 注册一个自动补全
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(Proto3, new Proto3CompletionItemProvider(), '.', '\"', '(')
	);

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider(
			'proto3',
			createProto3DocumentFormattingProvider()
		)
	);

	void detectClangFormat();

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('proto3.clang-format_executable')) {
				resetClangFormatDetection();
				void detectClangFormat();
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('proto3.gendoc', generateMarkdown),
		vscode.commands.registerTextEditorCommand('proto3.menus_gendoc', (editor) => {
			void rightClickGenDoc(editor).catch((e) => console.error('proto3.menus_gendoc', e));
		}),
		vscode.languages.registerDefinitionProvider(['proto3'], createProto3DefinitionProvider())
	);
}




// this method is called when your extension is deactivated
export function deactivate() { }
