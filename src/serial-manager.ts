import * as vscode from 'vscode'
import { AsyncSerial } from './async-serial'
import { Device } from './configuration'
import * as path from 'path';
import { promises as fs, constants as fsconstants, read } from 'fs';

// Required a rebuild for NODE MODULE VERSION 75 using
// ./node_modules/.bin/electron-rebuild -v 7.2.1

export type MessageCallback = (message: string) => void

const readyPattern = ">>> $"
const errorPattern = "Error"

export async function reboot(port: string, device: Device, callback: MessageCallback) {
    const serial = await AsyncSerial.open(port, { baudRate: 115200 })
    try {
        await terminateCurrentProgram(serial)
        await softReboot(serial, callback)
    } finally {
        await serial.close()
    }
}

export async function flashFiles(files: string[], port: string, device: Device, callback: MessageCallback) {
    const serial = await AsyncSerial.open(port, { baudRate: 115200 })
    try {
        await terminateCurrentProgram(serial)

        let previousDirectory = "."
        for (const file of files) {
            const currentDirectory = path.dirname(file)

            if (currentDirectory != previousDirectory) {
                await makeDirectory(serial, currentDirectory, callback)
                previousDirectory = currentDirectory
            }

            await flashFile(serial, file, callback)
        }

        await softReboot(serial, callback)
    } finally {
        await serial.close()
    }
}

async function flashFile(serial: AsyncSerial, file: string, callback: MessageCallback) {
    const workspacePath = getWorkspacePath()
    if (! workspacePath) {
        callback("Error: Unable to find workspace directory")
        return
    }

    callback(`Flashing file ${file}`)
    const workspacefile = path.resolve(workspacePath, file);
    const f = await fs.open(workspacefile, fsconstants.O_RDONLY)
    let offset = 0

    await sendStatement(serial, `file = open('${file}', 'wb', encoding = 'utf-8')`)
    while (true) {
        const data = new Buffer(1024)
        const readResult = await f.read(data, 0, 1024, offset)
        const arr = [...data.slice(0, readResult.bytesRead)]

        // await sendStatement(serial, `file.write(bytearray(${data.toString("utf8", 0, readResult.bytesRead)}""")`)
        await sendStatement(serial, `file.write(bytes([${arr}]))`)

        offset += readResult.bytesRead
        if (readResult.bytesRead < 1024) {
            break
        }
    }
    await f.close()
    await sendStatement(serial, "file.close()")
}

async function makeDirectory(serial: AsyncSerial, directory: string, callback: MessageCallback) {
    callback(`Making directory ${directory}`)
    const directories = directory.split(/[/\\]/)
    let previousPath = ""

    await sendStatement(serial, "import os")
    for (let currentDirectory of directories) {
        const newPath = `${previousPath}/${currentDirectory}`
        await sendStatement(serial, `if not '${currentDirectory}' in os.listdir('${previousPath}'): os.mkdir('${newPath}')\r`)
        previousPath = newPath
    }
}

async function terminateCurrentProgram(serial: AsyncSerial) {
    while (true) {
        await serial.write('\x03', true)
        const data = await serial.readLine()
        if (data?.match(readyPattern)) {
            break
        }
    }
}

async function waitFor(serial: AsyncSerial, pattern: string) {
    while (true) {
        const data = await serial.readLine()

        if (data?.match(pattern)) {
            break
        } else if (data?.match(errorPattern)) {
            throw new Error(data)
        }
    }
}

async function sendStatement(serial: AsyncSerial, statement: string) {
    await serial.write(statement + "\r\r", true)
    await waitFor(serial, readyPattern)
}

async function softReboot(serial: AsyncSerial, callback: MessageCallback) {
    await serial.write("\x04", true)
    await waitFor(serial, "reboot")
    callback("Device rebooted")
}

function getWorkspacePath(): string | undefined {
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath
    }
}
