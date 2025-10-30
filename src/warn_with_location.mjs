// @ts-check

import { addDiagnostic } from "./diagnostics.mjs";

/**
 * 共通の警告出力関数。変換前のXML文字列と該当ノードを受け取り、行番号・列番号を出力する。
 *
 * @param {import("./diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {string} xml - 変換前のXML文字列
 * @param {Element} node - 警告対象ノード
 * @param {string} message - 警告メッセージ
 */
export function warnWithLocation(diagnostics, xml, node, message) {
    const elementName = typeof node.tagName === "string" ? node.tagName : "";

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
    addDiagnostic(diagnostics, {
        type: "warning",
        message,
        elementName,
        line,
        column: col,
    });
}
