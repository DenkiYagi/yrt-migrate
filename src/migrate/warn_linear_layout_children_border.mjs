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
                    warnWithLocation(diagnostics, originalXml, node, [
                        `${tag}要素に${attr}属性が指定されています。`,
                        "帳票エンジンの挙動変更に伴い、描画結果が変化している可能性があります。",
                        "実際のPDF出力を目視で確認し、必要に応じてレイアウトXMLを手動で調整してください。"
                    ]);
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
