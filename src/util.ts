import { StatusBarItem, window, workspace } from "vscode";

export const searchToEndCommandID = "shadowReader.searchToEnd";
let myStatusBarItem: StatusBarItem = window.createStatusBarItem();
myStatusBarItem.command = searchToEndCommandID;

const defaultBossText = "Hello world";
let lastReadText = '';
let showingText = '';
let timeoutInternal: NodeJS.Timeout | null = null;

// 实际设置状态栏
function _setStatusBar(msg: string) {
    if (msg.length > 0) {
        myStatusBarItem.text = msg;
        showingText = msg;
        myStatusBarItem.show();
    } else {
        myStatusBarItem.hide();
    }
}

// 显示老板信息
function showBossText() {
    _setStatusBar(defaultBossText);
}

// 切换回正常信息
function showNormalText() {
    _setStatusBar(lastReadText);
    if (timeoutInternal) {
        clearTimeout(timeoutInternal);
    }
    let timeoutSecond = (<number>workspace.getConfiguration().get("shadowReader.hiddenTime")) * 1000;
    timeoutInternal = setTimeout(showBossText, timeoutSecond);
}

/**
 * 控制是否显示老板信息
 * @returns true: 显示正常信息; false: 显示老板信息
 */
export function toggleBossMsg(): boolean {
    if (showingText === defaultBossText) {
        showNormalText();
        return true;
    } else {
        showBossText();
        return false;
    }
}

export function setStatusBarMsg(msg: string) {
    lastReadText = msg;
    showNormalText();
}
