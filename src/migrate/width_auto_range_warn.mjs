import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

// width系属性のauto/range廃止マイグレーション: 警告のみ出力
export function migrate(yrtRoot) {
    if (!yrtRoot || !Array.isArray(yrtRoot) || yrtRoot.length < 3 || !Array.isArray(yrtRoot[2]?.l)) {
        return yrtRoot;
    }
    let warnings = [];
    yrtRoot[2].l.forEach(layout => {
        let xml = layout;
        if (Array.isArray(layout) && layout.length === 2 && layout[1]) {
            xml = layout[1];
        }
        if (!xml) return;
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
    });
    for (const warning of warnings) {
        console.warn(warning);
    }
    return yrtRoot;
}
