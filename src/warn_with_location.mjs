// @ts-check

import { getXPath } from "./utils.js";

/**
 * 共通の警告出力関数。変換前のXML文字列と該当ノードを受け取り、行番号・列番号を出力する。
 *
 * @param {string} xml - 変換前のXML文字列
 * @param {Element} node - 警告対象ノード
 * @param {string} message - 警告メッセージ
 */
export function warnWithLocation(xml, node, message) {
    // node.outerHTMLが使えればそれを利用
    let tagSnippet = node.outerHTML ? node.outerHTML.slice(0, 200) : '';
    // XPath取得
    let xpath = getXPath(node);

    // 行番号・列番号推定: XML文字列内で該当ノードの開始タグを検索
    let line = null, col = null;
    if (node.tagName) {
        // タグ名で検索
        const tagPattern = new RegExp(`<${node.tagName}[^>]*`, 'g');
        let match;
        let found = false;
        let matchIndexes = [];
        while ((match = tagPattern.exec(xml)) !== null) {
            matchIndexes.push(match.index);
            // outerHTMLの先頭数十文字と一致するかで判定
            if (tagSnippet && xml.substr(match.index, tagSnippet.length) === tagSnippet) {
                found = true;
                break;
            }
        }
        if (!found && matchIndexes.length > 0) {
            // n番目のノードならn番目の出現位置を使う
            // 親ノードから同じタグ名の子の中で何番目かを取得
            let n = 0;
            if (node.parentNode) {
                const siblings = Array.from(node.parentNode.childNodes).filter(
                    el => el.nodeType === 1 && /** @type {Element} */(el).tagName === node.tagName
                );
                n = siblings.indexOf(node);
            }
            // n番目（0-indexed）
            const idx = n >= 0 && n < matchIndexes.length ? matchIndexes[n] : matchIndexes[0];
            match = { index: idx };
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
    const locStr = (line && col) ? ` @${line}:${col}` : '';
    console.warn(`[WARNING] ${message}${xpathStr}${locStr}`);
}
