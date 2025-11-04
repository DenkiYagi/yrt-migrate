// @ts-check

import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * width系属性のauto/range廃止マイグレーション: 警告のみ出力
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void} 警告のみ、値は返さない
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    checkWidthAutoRange(diagnostics, originalDocument.documentElement, originalXml);
}

/**
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Element} root
 * @param {string} originalXml
 */
function checkWidthAutoRange(diagnostics, root, originalXml) {
    /** @param {any} node */
    function checkGridCols(node) {
        if (node.nodeType === 1 && node.tagName === 'Grid' && node.hasAttribute('cols')) {
            const val = node.getAttribute('cols')?.trim();
            if (typeof val === 'string') {
                const parts = val.split(/\s+/);
                if (parts.some(v => v.trim().toLowerCase() === 'auto' || v.includes(":"))) {
                    warnWithLocation(diagnostics, originalXml, node, [
                        "Grid要素のcols属性で auto/range 指定はできなくなりました。",
                        "レイアウトXMLを手動で修正し、固定値を直接指定してください。"
                    ]);
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
                    warnWithLocation(diagnostics, originalXml, node, [
                        "TableColumn要素のwidth属性で auto/range 指定はできなくなりました。",
                        "レイアウトXMLを手動で修正し、固定値を直接指定してください。"
                    ]);
                }
            }
        }
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                checkTableColumnWidth(node.childNodes[i]);
            }
        }
    }
    checkGridCols(root);
    checkTableColumnWidth(root);
}
