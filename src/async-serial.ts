import * as SerialPort from 'serialport'
import { EventEmitter } from 'events';

export class AsyncSerial {

    readonly connection: SerialPort
    readonly readline: SerialPort.parsers.Readline

    private buffer = new SerialBuffer
    private dataEvent = new EventEmitter()

    private constructor(connection: SerialPort) {
        this.connection = connection
        this.readline = new SerialPort.parsers.Readline({ delimiter: "\n" })
        this.connection.pipe(this.readline)

        this.readline.on("data", data => {
            data = data.split("\r").join("")
            this.buffer.append(data + "\n")
            this.dataEvent.emit("line")
        })

        this.connection.on("close", () => {
            this.readline.removeAllListeners("data")
        })
    }

    static async open(port: string, options?: SerialPort.OpenOptions): Promise<AsyncSerial> {
        return new Promise((resolve, reject) => {
            const connection = new SerialPort(port, options, error => {
                if (error) {
                    reject(error)
                } else {
                    resolve(new AsyncSerial(connection))
                }
            })
        })
    }

    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.close(error => {
                if (error) {
                    reject(error)
                } else {
                    resolve()
                }
            })
        })
    }

    async write(data: string, autoDrain: true): Promise<void>
    async write(data: string, autoDrain: false): Promise<boolean>
    async write(data: string, autoDrain: boolean): Promise<void | boolean> {
        let needsDrain = await new Promise<boolean>((resolve, reject) => {
            let result = this.connection.write(data, error => {
                if (error) {
                    reject(error)
                }
            })

            resolve(result)
        })

        if (autoDrain) {
            if (needsDrain) {
                return this.drain()
            }
        } else {
            return needsDrain
        }
    }

    async drain(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.drain(error => {
                if (error) {
                    reject(error)
                } else {
                    resolve()
                }
            })
        })
    }

    async readLine(timeout = 1000): Promise<string | null> {
        if (this.buffer.hasLine()) {
            return this.buffer.getLine()
        }

        const timeoutPromise = new Promise<null>(resolve => {
            setTimeout(() => { resolve(null) }, timeout)
        })
        const dataPromise = new Promise<string | null>(resolve => {
            this.dataEvent.once("line", () => {
                this.dataEvent.removeAllListeners("line")
                resolve(this.buffer.getLine())
            })
        })

        return Promise.race([dataPromise, timeoutPromise])
    }
}

class SerialBuffer {

    private buffer = ""

    append(data: string) {
        this.buffer += data
    }

    hasLine(): boolean {
        return this.buffer.includes("\n")
    }

    getLine(): string | null {
        if (! this.hasLine()) {
            return null
        }

        const cutoff = this.buffer.indexOf("\n")
        const line = this.buffer.substring(0, cutoff)
        this.buffer = this.buffer.substring(cutoff + 1)

        return line
    }
}
