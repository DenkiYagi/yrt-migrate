// @ts-check

import { getXPath } from "./utils.js";

/** @type {((message: string) => boolean | void) | null} */
let warningHandler = null;

/**
 * Exposed for unit tests to intercept warning messages.
 * If the handler returns true, the warning is treated as handled
 * and will not be written to stderr.
 * @param {(message: string) => boolean | void} handler
 */
export function setWarningHandler(handler) {
    const previous = warningHandler;
    warningHandler = handler;
    return previous;
}

/**
 * Clears the currently registered warning handler.
 * @param {((message: string) => boolean | void) | null} [fallback]
 */
export function clearWarningHandler(fallback = null) {
    warningHandler = fallback;
}

/**
 * @param {string} message
 */
function emitWarning(message) {
    if (warningHandler) {
        const handled = warningHandler(message);
        if (handled === true) {
            return;
        }
    }

    console.warn(message);
}

/**
 * 共通の警告出力関数。変換前のXML文字列と該当ノードを受け取り、行番号・列番号を出力する。
 *
 * @param {string} xml - 変換前のXML文字列
 * @param {Element} node - 警告対象ノード
 * @param {string} message - 警告メッセージ
 */
export function warnWithLocation(xml, node, message) {
    let xpath = getXPath(node);

    // 行番号・列番号推定: XML文字列内で該当ノードの開始タグを検索
    let line = null, col = null;
    if (node.tagName) {
        // タグ名で検索
        const escapedTagName = node.tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const tagPattern = new RegExp(`<${escapedTagName}\\b[^>]*`, 'g');
        let match;
        const matchIndexes = [];
        while ((match = tagPattern.exec(xml)) !== null) {
            matchIndexes.push(match.index);
        }
        if (matchIndexes.length > 0) {
            let occurrenceIndex = null;
            const doc = node.ownerDocument ?? null;
            if (doc && typeof doc.getElementsByTagName === "function") {
                const candidates = doc.getElementsByTagName(node.tagName);
                for (let i = 0; i < candidates.length; i += 1) {
                    if (candidates.item(i) === node) {
                        occurrenceIndex = i;
                        break;
                    }
                }
            }
            if (occurrenceIndex == null || occurrenceIndex < 0 || occurrenceIndex >= matchIndexes.length) {
                occurrenceIndex = 0;
            }
            match = { index: matchIndexes[occurrenceIndex] };
        }
        if (match) {
            // 行・列番号計算
            const before = xml.slice(0, match.index);
            line = before.split(/\r?\n/).length;
            const lastNewline = before.lastIndexOf('\n');
            col = match.index - (lastNewline >= 0 ? lastNewline : -1);
        }
    }
    const xpathStr = xpath ? ` (${xpath})` : '';
    const locStr = (line !== null && col !== null) ? ` @${line}:${col}` : '';
    const warningMessage = `[WARNING] ${message}${xpathStr}${locStr}`;

    emitWarning(warningMessage);
}
