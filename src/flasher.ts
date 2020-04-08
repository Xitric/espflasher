import * as vscode from 'vscode'
import * as configuration from './configuration'
import * as path from 'path'
import * as serial from './serial-manager'

const VISIBLE_TERMINAL_NAME = 'flash files'

export async function flashWorkspace() {
    const conf = await configuration.getConfiguration()
    if (! conf) {
        vscode.window.showErrorMessage('Error reading .espconfig.json from the current workspace. Have you remembered to initialize it with \'MicroPython ESP: Initialize\'?')
        return
    }

    const ignore = conf.ignore
    const filesToFlash = await collectFiles(ignore);

    vscode.window.showInformationMessage(`Flashing ${filesToFlash.length} files to device on port ${conf.port}`)
    const terminal = getFlasherTerminal()
    terminal.show()
    serial.flashFiles(filesToFlash, conf.port, conf.device, message => {
        terminal.sendText(`echo '${message}'`)
    })
}

async function collectFiles(ignore: string[]): Promise<string[]> {
    const ignoreGlobPattern = `{${ignore.join(',')}}`
    let files = await vscode.workspace.findFiles('**/*', ignoreGlobPattern)

    const workspacePath = getWorkspacePath()

    if (workspacePath) {
        let relativePaths = files.map(file => {
            const absoluteFilePath = file.fsPath
            return path.relative(workspacePath, absoluteFilePath).split("\\").join("/")
        })
    
        return relativePaths
    }

    return []
}

function getWorkspacePath(): string | undefined {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath
    }
}

function getFlasherTerminal(): vscode.Terminal {
    return vscode.window.terminals.find(terminal => terminal.name === VISIBLE_TERMINAL_NAME) ||
        vscode.window.createTerminal(VISIBLE_TERMINAL_NAME)
}
