import { getXPath } from "./utils.js";
// width_auto_range_warn.mjs
// width系属性のauto/range廃止マイグレーション: 警告のみ出力

export function migrate(doc, yrtRoot) {
    const warnings = [];
    if (!doc || !doc.documentElement) return yrtRoot;

    function checkGridCols(node) {
        if (node.nodeType === 1 && node.tagName === 'Grid' && node.hasAttribute('cols')) {
            const val = node.getAttribute('cols');
            if (val === 'auto' || /^\d*:\d*$/.test(val)) {
                const xpath = getXPath(node);
                warnings.push(`<Grid> の cols 属性に警告: cols=\"${val}\"（XPath: ${xpath}）`);
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
            const val = node.getAttribute('width');
            if (val === 'auto' || /^\d*:\d*$/.test(val)) {
                const xpath = getXPath(node);
                warnings.push(`<TableColumn> の width 属性に警告: width=\"${val}\"（XPath: ${xpath}）`);
            }
        }
        if (node.childNodes) {
            for (let i = 0; i < node.childNodes.length; i++) {
                checkTableColumnWidth(node.childNodes[i]);
            }
        }
    }

    checkGridCols(doc.documentElement);
    checkTableColumnWidth(doc.documentElement);
    if (warnings.length > 0) {
        console.warn('[width_auto_range_warn] 警告:', warnings.join('\n'));
    }
    return yrtRoot;
}
