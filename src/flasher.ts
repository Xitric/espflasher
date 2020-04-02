import * as vscode from 'vscode'
import * as configuration from './configuration'
import * as path from 'path';
import * as rshell from './rshell-util'

const VISIBLE_TERMINAL_NAME = 'flash files'
const HIDDEN_TERMINAL_NAME = 'flash files - internal'

export async function flashWorkspace() {
    const conf = await configuration.getConfiguration()
    if (! conf) {
        vscode.window.showErrorMessage('Error reading .espconfig.json from the current workspace. Have you remembered to initialize it with \'MicroPython ESP: Initialize\'?')
        return
    }

    const ignore = conf.ignore
    const filesToFlash = await collectFiles(ignore);

    await flashFiles(filesToFlash, conf.device, conf.port)
    vscode.window.showInformationMessage(`Flashing ${filesToFlash.length} files to device on port ${conf.port}`)
    // soft_reboot()

    // const terminal = getFlasherTerminal()
    // terminal.show()
    // terminal.sendText("rshell")
    // await sleep(10000)
    // terminal.sendText("ls")
}

// function soft_reboot() {
//     const terminal = getFlasherTerminal();
//     terminal.show()
//     terminal.sendText("rshell -p COM4 repl ~ \x04 ~")
// } 

async function collectFiles(ignore: string[]): Promise<string[]> {
    const ignoreGlobPattern = `{${ignore.join(',')}}`
    let files = await vscode.workspace.findFiles('**/*', ignoreGlobPattern)

    const workspacePath = getWorkspacePath()

    let relativePaths = files.map(file => {
        const absoluteFilePath = file.fsPath
        return path.relative(workspacePath, absoluteFilePath).split("\\").join("/")
    })

    return relativePaths
}

function getWorkspacePath(): string {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath
    }

    return ''
}

async function flashFiles(files: string[], device: configuration.Device, port: string) {
    const terminal = getFlasherTerminal()
    terminal.show()

    const command = rshell.fileFlasherCommand(files, device, port)
    terminal.sendText(command)
}

// async function flashFiles(files: string[], port: string) {
//     const flasherTerminal = getFlasherTerminal()

//     flasherTerminal.show(true)
//     flasherTerminal.sendText(`echo 'Flashing ${files.length} files to device on port ${port}'`)

//     let previousDirectory = "."
//     for (const file of files) {
//         if (path.dirname(file) != previousDirectory) {
//             previousDirectory = path.dirname(file)

//             if (! await directoryExists(port, previousDirectory)) {
//                 console.log("Me, an idiot, decided to write the dir " + previousDirectory)

//                 await executeAmpy(`ampy --port ${port} mkdir ${previousDirectory}`)
//                 flasherTerminal.sendText(`echo 'created directory ${previousDirectory}'`)
//             }
//         }
//         await executeAmpy(`ampy --port ${port} put ${file} ${file}`)
//         flasherTerminal.sendText(`echo 'flashed file ${file}'`)
//         await sleep(2000)
//     }
// }

function getFlasherTerminal(): vscode.Terminal {
    return vscode.window.terminals.find(terminal => terminal.name === VISIBLE_TERMINAL_NAME) ||
        vscode.window.createTerminal(VISIBLE_TERMINAL_NAME)
}

// async function executeAmpy(command: string): Promise<void> {
//     return new Promise((resolve, reject) => {
//         child.exec(command, {cwd: getWorkspacePath(), timeout: 10000}, async (error, _, stderr) => {
//             if (error) {
//                 if (stderr.includes("failed to access")) {
//                     try {
//                         await executeAmpy(command)
//                         resolve()
//                     } catch (err) {
//                         reject(err)
//                     }
//                 } else {
//                     if (error.signal == "SIGTERM") {
//                         try {
//                             await executeAmpy(command)
//                             resolve()
//                         } catch (err) {
//                             reject(err)
//                         }
//                     } else {
//                         reject(error)
//                     }
//                 }
//             } else {
//                 resolve()
//             }
//         })
//     })
// }

// async function directoryExists(port: string, directory: string): Promise<boolean> {
//     return new Promise(resolve => {
//         child.exec(`ampy --port ${port} ls ${directory}`, async (error, _, stderr) => {
//             if (error) {
//                 if (stderr.includes("failed to access")) {
//                     resolve(await directoryExists(port, directory))
//                 } else {
//                     resolve(false)
//                 }
//             } else {
//                 resolve(true)
//             }
//         })
//     })
// }

// function sleep(ms: number) {
//     return new Promise((resolve) => setTimeout(resolve, ms));
// }
