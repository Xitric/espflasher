import * as vscode from 'vscode';
import * as configuration from './configuration'

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "espflasher" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('extension.init', () => {
		configuration.initialize();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.flashFiles', async () => {
		let conf = await configuration.getConfiguration()
		vscode.window.showWarningMessage('Flash ' + conf?.port);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.clean', () => {
		vscode.window.showWarningMessage('Clean');
	}));

	context.subscriptions.push(vscode.commands.registerCommand('extension.softReboot', () => {
		vscode.window.showWarningMessage('Reboot');
	}));

	// Create .espconfig if missing
	// Read config from .espconfig
	// Create tree view with files from esp
	// Support flashing + rebooting
	// Support rebooting
}

export function deactivate() {
	console.log('EspFlasher deactivated');
}
