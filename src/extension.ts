import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const TERMINAL_NAME = 'Smart';

export function activate(context: vscode.ExtensionContext) {
    const runDisposable = vscode.commands.registerCommand('smart.run', async () => {
        const filePath = await getActiveSmartFilePath('executing');
        if (!filePath) {
            return;
        }

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

        const cmd = buildProcessCommand(emulatorPath, filePath);
        terminal.sendText(cmd);
    });

    const buildDisposable = vscode.commands.registerCommand('smart.build', async () => {
        const filePath = await getActiveSmartFilePath('compiling');
        if (!filePath) {
            return;
        }

        const config = vscode.workspace.getConfiguration('smart');
        const toolchainPath = config.get<string>('toolchainPath')?.trim() || '';
        const compilerPathSetting = stripOuterQuotes(config.get<string>('compilerPath')?.trim() || '');

        const defaultCompilerPath = getDefaultCompilerPath();
        const compilerPath =
            (compilerPathSetting && fs.existsSync(compilerPathSetting) ? compilerPathSetting : undefined) ??
            (defaultCompilerPath && fs.existsSync(defaultCompilerPath) ? defaultCompilerPath : undefined) ??
            (await resolveToolchainScript(toolchainPath, 'smart_build.exe'));

        if (!compilerPath) {
            vscode.window.showErrorMessage(
                'Unable to find smart_build.exe. Configure smart.compilerPath (full path) or smart.toolchainPath (folder containing smart_build.exe), or ensure Smart-SmartyKit is installed.'
            );
            return;
        }

        const terminal = getOrCreateTerminal(path.dirname(filePath));
        terminal.show(true);

        const cmd = buildProcessCommand(compilerPath, filePath);
        terminal.sendText(cmd);
    });

    context.subscriptions.push(runDisposable, buildDisposable);
}

export function deactivate() {}

async function getActiveSmartFilePath(actionLabel: string): Promise<string | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('Open a Smart file.');
        return undefined;
    }

    if (editor.document.languageId !== 'smart') {
        vscode.window.showErrorMessage('The Smart command only works on .sma files.');
        return undefined;
    }

    if (editor.document.isUntitled) {
        vscode.window.showErrorMessage(`Save the file before ${actionLabel} it.`);
        return undefined;
    }

    if (editor.document.isDirty) {
        const saved = await editor.document.save();
        if (!saved) {
            return undefined;
        }
    }

    return editor.document.fileName;
}

function buildProcessCommand(executablePath: string, programPath: string): string {
    if (process.platform === 'win32') {
        return `cmd /c ""${executablePath}" "${programPath}""`;
    }

    return `"${executablePath}" "${programPath}"`;
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

function getDefaultCompilerPath(): string | undefined {
    if (process.platform !== 'win32') {
        return undefined;
    }

    const localAppData = process.env.LOCALAPPDATA;
    if (!localAppData) {
        return undefined;
    }

    return path.join(localAppData, 'Smart-SmartyKit', 'smart_build.exe');
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