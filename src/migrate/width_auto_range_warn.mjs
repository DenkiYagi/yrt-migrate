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
    let warnings = [];
    for (const entry of yrtDocument.layouts) {
        if (!entry || typeof entry.xml !== 'string') continue;
        checkWidthAutoRange(entry.xml, warnings);
    }
    // Style XMLにも同じ関数で警告処理を適用
    if (typeof yrtDocument.style === 'string' && yrtDocument.style.trim().length > 0) {
        checkWidthAutoRange(yrtDocument.style, warnings);
    }
    for (const warning of warnings) {
        console.warn(warning);
    }
}

function checkWidthAutoRange(xml, warnings) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    function checkGridCols(node) {
        if (node.nodeType === 1 && node.tagName === 'Grid' && node.hasAttribute('cols')) {
            const val = node.getAttribute('cols')?.trim();
            if (typeof val === 'string') {
                if ((val.trim().toLowerCase() === 'auto') || val.includes(":")) {
                    const xpath = getXPath(node);
                    warnings.push(`[WARNING] <Grid> の cols 属性で auto/range 指定はサポートされなくなりました（XPath: ${xpath}）`);
                }
            }
        }
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                checkGridCols(node.childNodes[i]);
            }
        }
    }
    function checkTableColumnWidth(node) {
        if (node.nodeType === 1 && node.tagName === 'TableColumn' && node.hasAttribute('width')) {
            const val = node.getAttribute('width')?.trim();
            if (typeof val === 'string') {
                if (val.trim().toLowerCase() === 'auto' || val.includes(":")) {
                    const xpath = getXPath(node);
                    warnings.push(`[WARNING] <TableColumn> の width 属性で auto/range 指定はサポートされなくなりました（XPath: ${xpath}）`);
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
