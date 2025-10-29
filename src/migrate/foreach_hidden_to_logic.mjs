// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * @param {string} val
 * @returns {boolean}
 */
function isBindingVariable(val) {
    // ${...} 形式かどうか
    return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

/**
 * @param {any} el
 */
function migrateElement(el) {
    if (!el || !el.getAttribute) return;
    let foreach = el.getAttribute('foreach')?.trim();
    let hidden = el.getAttribute('hidden')?.trim();

    // まず値なしのパターンを処理
    if (foreach === "") {
        el.removeAttribute('foreach');
        foreach = null;
    }
    if (hidden === "") {
        el.removeAttribute('hidden');
        hidden = null;
    }

    const canConvertForeach = foreach && !hidden && isBindingVariable(foreach);
    const canConvertHidden = hidden && !foreach && isBindingVariable(hidden);

    if (canConvertForeach) {
        const logicVal = `foreach:${foreach}`;
        el.setAttribute('logic', logicVal);
        el.removeAttribute('foreach');
    } else if (canConvertHidden) {
        const logicVal = `if:${hidden.replace(/\$\{([^}]+)\}/, '${!$1}')}`;
        el.setAttribute('logic', logicVal);
        el.removeAttribute('hidden');
    }
    // 子要素を再帰的に処理
    if (el.childNodes) {
        for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child.nodeType === 1) { // ELEMENT_NODE
                migrateElement(child);
            }
        }
    }
}

/**
 * YrtDocument型: 全レイアウトXMLに対してforeach/hidden→logic変換を適用
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument} 変換後のYrtDocument
 */
export function migrate(yrtDocument) {
    const newDoc = structuredClone(yrtDocument);
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        if (doc && doc.documentElement) {
            migrateElement(doc.documentElement);
        }
        entry.xml = new XMLSerializer().serializeToString(doc.documentElement);
    }

    // Style XMLにも同様の変換を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(newDoc.style, "text/xml");
        if (styleDoc && styleDoc.documentElement) {
            migrateElement(styleDoc.documentElement);
        }
        newDoc.style = new XMLSerializer().serializeToString(styleDoc.documentElement);
    }
    return newDoc;
}
