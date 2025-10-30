// @ts-check

import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * @param {string|undefined|null} val
 * @returns {boolean}
 */
function isBinding(val) {
    return typeof val === "string" && /^\$\{[^}]+\}$/.test(val);
}

/**
 * @param {Element} node
 * @param {string} originalXml
 */
function checkSpan(diagnostics, node, originalXml) {
    if (node.nodeType === 1 && node.nodeName === "Span") {
        const color = node.getAttribute("color")?.trim();
        if (isBinding(color)) {
            warnWithLocation(diagnostics, originalXml, node, `<Span>のcolor属性にバインド変数は指定できません`);
        }
    }
    // 子要素も再帰的にチェック
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === 1) {
                checkSpan(diagnostics, /** @type {Element} */(child), originalXml);
            }
        }
    }
}

/**
 * <Span>要素のcolor属性がバインド変数なら警告を出す
 * @param {import("../diagnostics.mjs").Diagnostic[]} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    if (!originalDocument?.documentElement) return;
    checkSpan(diagnostics, originalDocument.documentElement, originalXml);
}
