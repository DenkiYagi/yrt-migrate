// @ts-check

import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} document
 * @param {string} originalXml
 */
function checkBorderAdjacentLineWarn(diagnostics, document, originalXml) {
    const targets = ["LayoutHeader", "LayoutBody", "LayoutFooter"];
    const attrs = ["borderThickness", "borderColor", "borderStyle"];
    for (const tag of targets) {
        const nodes = Array.from(document.getElementsByTagName(tag));
        for (const node of nodes) {
            for (const attr of attrs) {
                if (node.hasAttribute(attr)) {
                    warnWithLocation(diagnostics, originalXml, node, [`${tag} 要素に${attr}属性が含まれています。罫線のレイアウトが変わる可能性があります。`]);
                }
            }
        }
    }
}

/**
 * レイアウトの隣接部の罫線属性を検出し、警告を出すマイグレーション
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    if (!originalDocument) return;
    checkBorderAdjacentLineWarn(diagnostics, originalDocument, originalXml);
}
