import { workspace, ExtensionContext } from "vscode";
import { setStatusBarMsg, toggleBossMsg } from "./util";
import { BookKind, BookStore } from "./parse/model";
import { Parser } from "./parse/interface";
import { TxtFileParser } from "./parse/txt";
import { CrawelerDomains } from "./const";
import { BiquWebParser } from "./parse/biqu";
import { CaimoWebParser } from "./parse/caimo";

let bookPath: string = "";
let parser: Parser;
const readEOFTip = "";
let timer: null | NodeJS.Timeout = null;


function loadParser(context: ExtensionContext, bookPath: string): Parser {
  let store = context.globalState.get(bookPath, 0);

  let bookStore: BookStore;
  // compatible old version
  if (typeof store === "number") {
    bookStore = {
      kind: BookKind.local,
      readedCount: store,
    };
  } else {
    bookStore = store as BookStore;
  }

  switch (bookStore.kind) {
    case BookKind.local:
      return new TxtFileParser(bookPath, bookStore.readedCount);
    
    case BookKind.online:
      if(bookStore.sectionPath?.startsWith(<string>CrawelerDomains.get("biquURL"))) {
        return new BiquWebParser(<string>bookStore.sectionPath, bookStore.readedCount, bookPath);
      } else if(bookStore.sectionPath?.startsWith(<string>CrawelerDomains.get("caimoURL"))) {
        return new CaimoWebParser(<string>bookStore.sectionPath, bookStore.readedCount, bookPath);
      }
      throw new Error("book url is not supported");
    default:
      throw new Error("book kind is not supported");
  }
}

export async function readNextLine(context: ExtensionContext): Promise<string> {
  let pageSize: number = <number>workspace.getConfiguration().get("shadowReader.pageSize");
  let content = await parser.getNextPage(pageSize);
  if (content.length === 0) {
    return readEOFTip;
  }
  let percent = parser.getPercent();
  context.globalState.update(bookPath, parser.getPersistHistory());
  return `${content}   ${percent}`;
}

export async function readPrevLine(context: ExtensionContext): Promise<string> {
  let pageSize: number = <number>workspace.getConfiguration().get("shadowReader.pageSize");
  let content = await parser.getPrevPage(pageSize);
  let percent = parser.getPercent();
  context.globalState.update(bookPath, parser.getPersistHistory());
  return `${content}   ${percent}`;
}

/**
 * 控制是否自动翻页
 * @param context 
 * @param status 新的状态，表示是否应该自动翻页，如果不传则自动切换
 * @returns true: 开始自动翻页，false: 停止自动翻页
 */
export async function toggleAutoScroll(context: ExtensionContext, status?: boolean): Promise<boolean> {
  let autoScroll = <number>workspace.getConfiguration().get("shadowReader.scrollTime");
  const shouldStart = status !== undefined ? status : (autoScroll && !timer);
  if (shouldStart) {
      timer = setInterval(async () => {
        const message = await readNextLine(context);
        setStatusBarMsg(message);
      }, autoScroll * 1000);
      return true;
  } else if (timer) {
      clearInterval(timer);
      timer = null;
      return false;
  }
  return false;
}

/**
 * 开始自动翻页
 * @param context 
 * @returns 
 */
export async function startAutoScroll(context: ExtensionContext): Promise<boolean> {
  return toggleAutoScroll(context, true);
}

/**
 * 停止自动翻页
 * @param context 
 * @returns 
 */
export async function stopAutoScroll(context: ExtensionContext): Promise<boolean> {
  return toggleAutoScroll(context, false);
}

export function closeAll(): void {
  if (parser) {
    parser.close();
  }
}

export function loadFile(context: ExtensionContext, newfilePath: string) {
  if (parser) {
    parser.close();
  }
  parser = loadParser(context, newfilePath);
  bookPath = newfilePath;
  let text = readNextLine(context).then(text => {
    setStatusBarMsg(text);
  });
}

export async function searchContentToEnd(context: ExtensionContext, keyword: string): Promise<string> {
  let keywordIndex = 0;
  let preLineEndMatch = false;
  let pageSize: number = <number>workspace.getConfiguration().get("shadowReader.pageSize");
  while (true) {
    let content = await parser.getNextPage(pageSize);
    if (content.length === 0) {
      break;
    }

    for (let char of content) {
      if (char === keyword[keywordIndex]) {
        keywordIndex++;
        if (keywordIndex === keyword.length) {
          if (preLineEndMatch) {
            return await readPrevLine(context);
          } else {
            let percent = parser.getPercent();
            context.globalState.update(bookPath, parser.getPersistHistory());
            return `${content}   ${percent}`;;
          }
        }
      } else {
        keywordIndex = 0;
      }
    }

    // between two lines
    if (keywordIndex !== 0) {
      preLineEndMatch = true;
    }
  }
  return readEOFTip;
}
