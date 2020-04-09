import * as vscode from 'vscode';
import * as configuration from './configuration'
import * as flasher from './flasher'

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "espflasher" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('extension.init', () => {
		configuration.initialize();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.flashFiles', async () => {
		await flasher.flashWorkspace();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.clean', () => {
		vscode.window.showWarningMessage('Clean');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.softReboot', async () => {
		await flasher.reboot()
	}));

	// Create tree view with files from esp
	// Support flashing + rebooting
	// Support rebooting
	// Support flashing firmware with esptool!!!
}

export function deactivate() {
	console.log('EspFlasher deactivated');
}
