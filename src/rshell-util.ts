import {Device} from "./configuration"

export function fileFlasherCommand(files: string[], device: Device, port: string) {
    let commands = files.map(file => flashFile(file, device))
    commands.push(softReboot())
    return buildCompositeCommand(commands, port)
}

export function softRebootCommand(port: string): string {
    return `${commandPrefix(port)} repl ~ \x04 ~`
}

function buildCompositeCommand(commands: string[], port: string) {
    return `${commandPrefix(port)} '${commands.join(";")}'`
}

function commandPrefix(port: string) {
    return `rshell -p ${port}`  //--quiet
}

function flashFile(file: string, device: Device) {
    const dirPrefix = getDirectoryPrefix(device)
    return `cp ${file} ${dirPrefix}${file};ls ${dirPrefix}0`
}

function getDirectoryPrefix(device: Device) {
    switch(device) {
        case Device.Pyboard:
        case Device.ESP32:
        case Device.ESP8266:
            return "/pyboard/"
        case Device.Microbit:
            return "/flash/"
    }
}

function softReboot() {
    return "repl ~ \x04 ~"
}
