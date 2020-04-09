# ESP Flasher

A collection of simple commands for interfacing with a MicroPython ESP device through VSCode. Unlike other, similar extensions, this extension has no external dependencies.

## Features

Currently, the following features are supported:
- Initialize the workspace with a settings file for controlling this extension.
- Flashing the current workspace to an ESP.
- Rebooting an ESP.

Planned future features include:
- Cleaning all files installed on the ESP that are not also present in the workspace.
- Browsing the ESP file system through VSCode.

## Extension Settings

This extension is configured on a per-directory basis using a special `.espconfig.json` file. This file must be present in the root of the workspace for the extension to work. To create the file, use the command:

```
MicroPython ESP: Initialize
```

The anatomy of the settings file is as such, and is described below:

```json
{
	"port": "COM4",
	"device": "ESP32",
	"ignore": [
		"**/.*",
		"**/*.pyi",
		"**/LICENSE*",
		"__pycache__*"
	]
}
```

- `port`: The port on your computer to which the ESP is connected.
- `device`: The device type. This is required since different devices work slightly differently.
- `ignore`: A list of `glob` patterns describing files in the workspace that should be ignored when flashing to the ESP.

## Release Notes

### 1.0.0

Initial release supporting the following commands:
- Initializing the workspace with an `.espconfig.json` file.
- Flashing the workspace to an ESP32.
- Rebooting the ESP32.
