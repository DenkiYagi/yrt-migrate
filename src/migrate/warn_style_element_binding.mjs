// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

const STYLE_TAGS = ["GridStyle", "TableStyle", "ColumnTextStyle"];

/**
 * @param {Element} node
 * @param {string} originalXml
 */
function checkNode(node, originalXml) {
    if (node.nodeType !== 1) return;
    if (STYLE_TAGS.includes(node.tagName)) {
        for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            if (/^\$\{[^}]+\}$/.test(attr.value)) {
                warnWithLocation(
                    originalXml,
                    node,
                    `${node.tagName} の ${attr.name} 属性値にバインド変数 (${attr.value}) が含まれています`
                );
            }
        }
    }
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i];
            if (child?.nodeType === 1) {
                checkNode(/** @type {Element} */(child), originalXml);
            }
        }
    }
}

/**
 * 旧スタイル要素（`GridStyle` 等）に含まれるバインド変数を警告する
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @param {string} originalXml
 * @returns {void}
 */
export function migrate(yrtDocument, originalXml) {
    for (const entry of yrtDocument.layouts) {
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        checkNode(doc.documentElement, originalXml);
    }
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(yrtDocument.style, "text/xml");
        checkNode(styleDoc.documentElement, originalXml);
    }
}
