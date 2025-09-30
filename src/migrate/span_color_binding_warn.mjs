// @ts-check

import { DOMParser } from "@xmldom/xmldom";
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
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument - 変換対象のYrtDocument
 * @param {string} originalXml - 元のYRT XML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(yrtDocument, originalXml) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return;
    yrtDocument.layouts.forEach(layoutEntry => {
        if (!layoutEntry || typeof layoutEntry.xml !== "string") return;
        const doc = new DOMParser().parseFromString(layoutEntry.xml, "text/xml");
        if (doc.documentElement) {
            checkSpan(doc.documentElement, originalXml);
        }
    });
    // Style XMLにも同様の警告処理を適用
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(yrtDocument.style, "text/xml");
        if (styleDoc.documentElement) {
            checkSpan(styleDoc.documentElement, originalXml);
        }
    }
}
