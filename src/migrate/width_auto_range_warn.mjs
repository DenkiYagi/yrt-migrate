// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * width系属性のauto/range廃止マイグレーション: 警告のみ出力
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @param {string} originalXml - 元のYRT XML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(yrtDocument, originalXml) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return;
    for (const entry of yrtDocument.layouts) {
        if (!entry || typeof entry.xml !== 'string') continue;
        checkWidthAutoRange(entry.xml, originalXml);
    }
}

/**
 * @param {string} xml
 * @param {string} originalXml
 */
function checkWidthAutoRange(xml, originalXml) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    /** @param {any} node */
    function checkGridCols(node) {
        if (node.nodeType === 1 && node.tagName === 'Grid' && node.hasAttribute('cols')) {
            const val = node.getAttribute('cols')?.trim();
            if (typeof val === 'string') {
                const parts = val.split(/\s+/);
                if (parts.some(v => v.trim().toLowerCase() === 'auto' || v.includes(":"))) {
                    warnWithLocation(originalXml, node, `<Grid> の cols 属性で auto/range 指定はサポートされなくなりました。手動で幅調整を行う必要があります。`);
                }
            }
        }
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                checkGridCols(node.childNodes[i]);
            }
        }
    }
    /** @param {any} node */
    function checkTableColumnWidth(node) {
        if (node.nodeType === 1 && node.tagName === 'TableColumn' && node.hasAttribute('width')) {
            const val = node.getAttribute('width')?.trim();
            if (typeof val === 'string') {
                if (val.trim().toLowerCase() === 'auto' || val.includes(":")) {
                    warnWithLocation(originalXml, node, `<TableColumn> の width 属性で auto/range 指定はサポートされなくなりました。手動で幅調整を行う必要があります。`);
                }
            }
        }
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                checkTableColumnWidth(node.childNodes[i]);
            }
        }
    }
    if (doc.documentElement) {
        checkGridCols(doc.documentElement);
        checkTableColumnWidth(doc.documentElement);
    }
}
