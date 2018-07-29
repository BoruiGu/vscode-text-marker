import * as Const from './const';
import CommandFactory from './command-factory';

export default class AppIntegrator {
    private readonly commandFactory: CommandFactory;
    private readonly vscode: any;

    static create(vscode, logger) {
        const commandFactory = new CommandFactory({vscode, logger});
        return new AppIntegrator({commandFactory, vscode});
    }

    constructor(params) {
        this.commandFactory = params.commandFactory;
        this.vscode = params.vscode;
    }

    integrate(context) {
        this.registerCommands(context);
        this.registerTextEditorCommands(context);
        this.registerEventListeners(context);
        this.prepareExtensionEventsDrivenItems();
        this.broadcastReady();
    }

    private registerEventListeners(context) {
        const decorationRefresher = this.commandFactory.createDecorationRefresher();
        this.vscode.window.onDidChangeActiveTextEditor(
            decorationRefresher.refresh, decorationRefresher, context.subscriptions);
        this.vscode.workspace.onDidChangeTextDocument(
            decorationRefresher.refreshWithDelay, decorationRefresher, context.subscriptions);
    }

    private registerCommands(context) {
        const factory = this.commandFactory;
        const commandMap = new Map([
            [`${Const.EXTENSION_ID}.highlightUsingRegex`, factory.createHighlightUsingRegex()],
            [`${Const.EXTENSION_ID}.clearAllHighlight`, factory.createRemoveAllHighlightsCommand()],
            [`${Const.EXTENSION_ID}.saveAllHighlights`, factory.createSaveAllHighlightsCommand()],
            [`${Const.EXTENSION_ID}.toggleCaseSensitivity`, factory.createToggleCaseSensitivityCommand()],
            [`${Const.EXTENSION_ID}.toggleModeForCaseSensitivity`, factory.createToggleCaseSensitivityModeCommand()],
            [`${Const.EXTENSION_ID}.toggleWholeMatch`, factory.createToggleWholeMatchCommand()],
            [`${Const.EXTENSION_ID}.toggleModeForWholeMatch`, factory.createToggleWholeMatchModeCommand()],
            [`${Const.EXTENSION_ID}.unhighlight`, factory.createUnhighlightCommand()]
        ]);
        commandMap.forEach((command, commandName) => {
            const disposable = this.vscode.commands.registerCommand(commandName, command.execute, command);
            context.subscriptions.push(disposable);
        });
    }

    private registerTextEditorCommands(context) {
        const factory = this.commandFactory;
        const commandMap = new Map([
            [`${Const.EXTENSION_ID}.toggleHighlight`, factory.createToggleHighlightCommand()],
            [`${Const.EXTENSION_ID}.updateHighlight`, factory.createUpdateHighlightCommand()]
        ]);
        commandMap.forEach((command, commandName) => {
            const disposable = this.vscode.commands.registerTextEditorCommand(commandName, command.execute, command);
            context.subscriptions.push(disposable);
        });
    }

    private prepareExtensionEventsDrivenItems() {
        this.commandFactory.createSavedHighlightsRestorer();
        this.commandFactory.createToggleCaseSensitivityModeButton();
        this.commandFactory.createToggleWholeMatchModeButton();
    }

    private broadcastReady() {
        this.commandFactory.getEventBus().emit(Const.Event.EXTENSION_READY);
    }

}
