// @ts-check

import { warnWithLocation } from "../warn_with_location.mjs";

const STYLE_TAGS = ["GridStyle", "TableStyle", "ColumnTextStyle"];

/**
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Element} node
 * @param {string} originalXml
 */
function checkNode(diagnostics, node, originalXml) {
    if (node.nodeType !== 1) return;
    if (STYLE_TAGS.includes(node.tagName)) {
        for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            if (/^\$\{[^}]+\}$/.test(attr.value)) {
                warnWithLocation(
                    diagnostics,
                    originalXml,
                    node,
                    [
                        `${node.tagName} 要素は廃止され、新たな指定方法としてスタイルXMLが導入されました。`,
                        "スタイルXMLではテンプレート変数を使用できません。",
                        `${node.tagName} の ${attr.name} 属性値にテンプレート変数 (${attr.value}) が指定されているため、自動変換できません。`,
                        "固定値を直接指定してください。"
                    ]
                );
            }
        }
    }
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child?.nodeType === 1) {
                checkNode(diagnostics, /** @type {Element} */(child), originalXml);
            }
        }
    }
}

/**
 * 旧スタイル要素（`GridStyle` 等）に含まれるテンプレート変数を警告する
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void}
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    if (!originalDocument?.documentElement) return;
    checkNode(diagnostics, originalDocument.documentElement, originalXml);
}
