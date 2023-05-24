// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  closeAll,
  readNextLine,
  readPrevLine,
  searchToEndCommandID,
  setStatusBarMsg,
  showMainMenu,
  showSearchKeywordBox,
  toggleAutoScroll,
  toggleBossMsg,
} from "./menu";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let searchKeyWordToEnd = vscode.commands.registerCommand(
    searchToEndCommandID,
    () => {
      showSearchKeywordBox(context);
    }
  );
  context.subscriptions.push(searchKeyWordToEnd);

  let getNextPage = vscode.commands.registerCommand(
    "shadowReader.getNextPage",
    () => {
      readNextLine(context).then((text) => {
        setStatusBarMsg(text);
      });
    }
  );
  context.subscriptions.push(getNextPage);

  let getPrevPage = vscode.commands.registerCommand(
    "shadowReader.getPrevPage",
    () => {
      readPrevLine(context).then((text) => {
        setStatusBarMsg(text);
      });
    }
  );
  context.subscriptions.push(getPrevPage);

  let startMain = vscode.commands.registerCommand(
    "shadowReader.start",
    async () => {
      await showMainMenu(context);
    }
  );
  context.subscriptions.push(startMain);

  let showBossInfo = vscode.commands.registerCommand(
    "shadowReader.showBossInfo",
    () => {
      toggleBossMsg(context);
    }
  );
  context.subscriptions.push(showBossInfo);

  let autoScroll = vscode.commands.registerCommand(
    "shadowReader.toggleAutoScroll",
    () => {
      toggleAutoScroll(context);
    }
  );

  context.subscriptions.push(autoScroll);
}

// this method is called when your extension is deactivated
export function deactivate() {
  closeAll();
}
