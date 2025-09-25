// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

/**
 * width系属性のauto/range廃止マイグレーション: 警告のみ出力
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return;
    /** @type {string[]} */
    let warnings = [];
    for (const entry of yrtDocument.layouts) {
        if (!entry || typeof entry.xml !== 'string') continue;
        checkWidthAutoRange(entry.xml, warnings);
    }
    for (const warning of warnings) {
        console.warn(warning);
    }
}

/**
 * @param {string} xml
 * @param {string[]} warnings
 */
function checkWidthAutoRange(xml, warnings) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    /** @param {any} node */
    function checkGridCols(node) {
        if (node.nodeType === 1 && node.tagName === 'Grid' && node.hasAttribute('cols')) {
            const val = node.getAttribute('cols')?.trim();
            if (typeof val === 'string') {
                const parts = val.split(/\s+/);
                if (parts.some(v => v.trim().toLowerCase() === 'auto' || v.includes(":"))) {
                    const xpath = getXPath(node);
                    warnings.push(`[WARNING] <Grid> の cols 属性で auto/range 指定はサポートされなくなりました。手動で幅調整を行う必要があります。（${xpath}）`);
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
                    const xpath = getXPath(node);
                    warnings.push(`[WARNING] <TableColumn> の width 属性で auto/range 指定はサポートされなくなりました。手動で幅調整を行う必要があります。（${xpath}）`);
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
