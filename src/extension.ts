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
        const toolchainPath = config.get<string>('toolchainPath')?.trim() || '';
        const emulatorPathSetting = stripOuterQuotes(config.get<string>('emulatorPath')?.trim() || '');

        const defaultEmulatorPath = getDefaultEmulatorPath();
        const emulatorPath =
            (emulatorPathSetting && fs.existsSync(emulatorPathSetting) ? emulatorPathSetting : undefined) ??
            (defaultEmulatorPath && fs.existsSync(defaultEmulatorPath) ? defaultEmulatorPath : undefined) ??
            (await resolveToolchainScript(toolchainPath, 'smart_emulator.exe'));

        if (!emulatorPath) {
            vscode.window.showErrorMessage(
                'Unable to find smart_emulator.exe. Configure smart.emulatorPath (full path) or smart.toolchainPath (folder containing smart_emulator.exe), or ensure Smart-SmartyKit is installed.'
            );
            return;
        }

        const terminal = getOrCreateTerminal(path.dirname(filePath));
        terminal.show(true);

        const cmd = buildEmulatorCommand(emulatorPath, filePath);
        terminal.sendText(cmd);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

function buildEmulatorCommand(emulatorPath: string, programPath: string): string {
    if (process.platform === 'win32') {
        return `cmd /c ""${emulatorPath}" "${programPath}""`;
    }

    return `"${emulatorPath}" "${programPath}"`;
}

function getDefaultEmulatorPath(): string | undefined {
    if (process.platform !== 'win32') {
        return undefined;
    }

    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) {
        return undefined;
    }

    return path.join(localAppData, 'Smart-SmartyKit', 'smart_emulator.exe');
}

function stripOuterQuotes(value: string): string {
    if (!value) {
        return value;
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        return value.slice(1, -1);
    }

    return value;
}

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