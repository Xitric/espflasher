import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import * as path from 'path';

export interface EspConfiguration {
    port: string | undefined
    ignore: string[]
}

function getConfigFilePath(): string | undefined {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        return path.resolve(workspacePath, '.espconfig.json');
    }

    return undefined
}

export async function initialize(): Promise<void> {
    const configFilePath = getConfigFilePath()
    if (configFilePath) {
        try {
            await fs.access(configFilePath)
            vscode.window.showInformationMessage('The current workspace has already been initialized');
        } catch (error) {
            const port = await getConfigOptions();
            try {
                await makeConfigFile(configFilePath, port);
                vscode.window.showInformationMessage('Successfully initialized the current workspace');
            } catch (err) {
                vscode.window.showErrorMessage('Error initializing workspace: ' + err);
            }
        }
    }
}

async function getConfigOptions(): Promise<string | undefined> {
    const inputOptions: vscode.InputBoxOptions = {
        ignoreFocusOut: true,
        value: getPortPlaceholder(),
        prompt: 'Specify the port connected to the ESP'
    }
    
    return await vscode.window.showInputBox(inputOptions);
}

async function makeConfigFile(path: string, port?: string): Promise<void> {
    const configTemplate: EspConfiguration = {
        port: port || getPortPlaceholder(),
        ignore: []
    }
    
    await fs.writeFile(path, JSON.stringify(configTemplate, null, '\t'));
}

function getPortPlaceholder(): string {
    switch(process.platform) {
        case 'win32': return 'COM'
        case 'darwin': return '/dev/cu.'
        default: return '/dev/tty'
    }
}

export async function getConfiguration(): Promise<EspConfiguration | undefined> {
    const configFilePath = getConfigFilePath()

    if (configFilePath) {
        const data = await fs.readFile(configFilePath)
        return JSON.parse(data.toString())
    }

    return undefined
}
