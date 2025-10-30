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
function checkSpan(node, originalXml) {
    if (node.nodeType === 1 && node.nodeName === "Span") {
        const color = node.getAttribute("color")?.trim();
        if (isBinding(color)) {
            warnWithLocation(originalXml, node, `<Span>のcolor属性にバインド変数は指定できません`);
        }
    }
    // 子要素も再帰的にチェック
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child.nodeType === 1) {
                checkSpan(/** @type {Element} */(child), originalXml);
            }
        }
    }
}

/**
 * <Span>要素のcolor属性がバインド変数なら警告を出す
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(originalDocument, originalXml) {
    if (!originalDocument?.documentElement) return;
    checkSpan(originalDocument.documentElement, originalXml);
}
