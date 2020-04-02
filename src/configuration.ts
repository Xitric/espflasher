import * as vscode from 'vscode';
import { promises as fs } from 'fs';
import * as path from 'path';

export enum Device {
    ESP32 = "ESP32",
    ESP8266 = "ESP8266",
    Pyboard = "Pyboard",
    Microbit = "Micro:bit"
}

export interface EspConfiguration {
    port: string
    device: Device
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
            const deviceType = await getDeviceTypeFromUser();
            if (!deviceType) {
                vscode.window.showErrorMessage("You must select a device type to initialize the workspace");
                return
            }

            const port = await getPortFromUser(deviceType);
            if (!port) {
                vscode.window.showErrorMessage("You must specify a serial port to initialize the workspace");
                return
            }

            try {
                await makeConfigFile(configFilePath, deviceType, port);
                vscode.window.showInformationMessage('Successfully initialized the current workspace');
            } catch (err) {
                vscode.window.showErrorMessage('Error initializing workspace: ' + err);
            }
        }
    }
}

async function getDeviceTypeFromUser(): Promise<string | undefined> {
    const inputOptions: vscode.QuickPickOptions = {
        ignoreFocusOut: true,
        canPickMany: false,
        placeHolder: "Please select your device type"
    }
    const deviceTypes = Object.values(Device).map(device => device.valueOf())
    
    return await vscode.window.showQuickPick(deviceTypes, inputOptions)
}

async function getPortFromUser(deviceType: string): Promise<string | undefined> {
    const inputOptions: vscode.InputBoxOptions = {
        ignoreFocusOut: true,
        value: getPortPlaceholder(),
        prompt: `Specify the port connected to the ${deviceType}`
    }
    
    return await vscode.window.showInputBox(inputOptions);
}

async function makeConfigFile(path: string, deviceType: string, port: string): Promise<void> {
    const normalizedDeviceType = deviceType.replace(":", "")
    const device = Device[normalizedDeviceType as keyof typeof Device]
    const configTemplate: EspConfiguration = {
        port: port,
        device: device,
        ignore: [
            "**/.*",
            "**/*.pyi",
            "**/LICENSE*",
            "__pycache__*"
        ]
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
