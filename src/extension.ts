import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const TERMINAL_NAME = 'Smart';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('smart.run', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('Open a Smart file.');
            return;
        }

        if (editor.document.languageId !== 'smart') {
            vscode.window.showErrorMessage('The Smart command only works on .sma files.');
            return;
        }

        if (editor.document.isUntitled) {
            vscode.window.showErrorMessage('Save the file before executing it.');
            return;
        }

        if (editor.document.isDirty) {
            const saved = await editor.document.save();
            if (!saved) {
                return;
            }
        }

        const filePath = editor.document.fileName;
        const config = vscode.workspace.getConfiguration('smart');
        const pythonCommand = config.get<string>('pythonCommand')?.trim() || 'python';
        const toolchainPath = config.get<string>('toolchainPath')?.trim() || '';

        const emulatorPath = await resolveToolchainScript(toolchainPath, 'smart_emulator.py');
        if (!emulatorPath) {
            vscode.window.showErrorMessage(
                'Unable to find smart_emulator.py. Configure smart.toolchainPath (smartykit_compiler folder) or open the smartykit_compiler folder in your workspace.'
            );
            return;
        }

        const terminal = getOrCreateTerminal(path.dirname(filePath));
        terminal.show(true);

        const cmd = `${pythonCommand} "${emulatorPath}" "${filePath}"`;
        terminal.sendText(cmd);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

async function resolveToolchainScript(toolchainPath: string, scriptName: string): Promise<string | undefined> {
    if (toolchainPath) {
        const candidate = path.join(toolchainPath, scriptName);
        return fs.existsSync(candidate) ? candidate : undefined;
    }

    const found = await vscode.workspace.findFiles(`**/${scriptName}`, '**/node_modules/**', 1);
    return found.length ? found[0].fsPath : undefined;
}

function getOrCreateTerminal(cwd: string): vscode.Terminal {
    const existing = vscode.window.terminals.find((t) => t.name === TERMINAL_NAME);
    if (existing) {
        return existing;
    }

    return vscode.window.createTerminal({ name: TERMINAL_NAME, cwd });
}