// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

function isBindingVariable(val) {
    // ${...} 形式かどうか
    return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

function migrateElement(el, warnings) {
    if (!el || !el.getAttribute) return;
    let foreach = el.getAttribute('foreach')?.trim();
    let hidden = el.getAttribute('hidden')?.trim();
    const logic = el.getAttribute('logic')?.trim();

    // まず値なしのパターンを処理
    if (foreach === "") {
        el.removeAttribute('foreach');
        foreach = null;
    }
    if (hidden === "") {
        el.removeAttribute('hidden');
        hidden = null;
    }

    // foreachとhidden両方ある場合はforeachのみlogic化、hiddenは警告のみ
    if (foreach && hidden && !logic) {
        const logicVal = `foreach:${foreach}`;
        if (!isBindingVariable(foreach)) {
            const xpath = getXPath(el);
            warnings.push(`[WARNING] foreach属性の値 "${foreach}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。（XPath: ${xpath}）`);
        }
        el.setAttribute('logic', logicVal);
        el.removeAttribute('foreach');
        const xpath = getXPath(el);
        warnings.push(`[WARNING] logic属性が既に存在するためhidden属性は変換しませんでした（XPath: ${xpath}）`);
    } else if (foreach) {
        if (logic) {
            const xpath = getXPath(el);
            warnings.push(`[WARNING] logic属性が既に存在するためforeach属性は変換しませんでした（XPath: ${xpath}）`);
        } else {
            const logicVal = `foreach:${foreach}`;
            if (!isBindingVariable(foreach)) {
                const xpath = getXPath(el);
                warnings.push(`[WARNING] foreach属性の値 "${foreach}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。（XPath: ${xpath}）`);
            }
            el.setAttribute('logic', logicVal);
            el.removeAttribute('foreach');
        }
    } else if (hidden) {
        if (logic) {
            const xpath = getXPath(el);
            warnings.push(`[WARNING] logic属性が既に存在するためhidden属性は変換しませんでした（XPath: ${xpath}）`);
        } else {
            const logicVal = `if:${hidden}`;
            if (!isBindingVariable(hidden)) {
                const xpath = getXPath(el);
                warnings.push(`[WARNING] hidden属性の値 "${hidden}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。（XPath: ${xpath}）`);
            }
            el.setAttribute('logic', logicVal);
            el.removeAttribute('hidden');
        }
    }
    // 子要素を再帰的に処理
    if (el.childNodes) {
        for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child.nodeType === 1) { // ELEMENT_NODE
                migrateElement(child, warnings);
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
    let allWarnings = [];
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        const warnings = [];
        if (doc && doc.documentElement) {
            migrateElement(doc.documentElement, warnings);
        }
        if (warnings.length > 0) {
            allWarnings = allWarnings.concat(warnings);
        }
        entry.xml = new XMLSerializer().serializeToString(doc.documentElement);
    }

    // Style XMLにも同様の変換を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(newDoc.style, "text/xml");
        const styleWarnings = [];
        if (styleDoc && styleDoc.documentElement) {
            migrateElement(styleDoc.documentElement, styleWarnings);
        }
        if (styleWarnings.length > 0) {
            allWarnings = allWarnings.concat(styleWarnings);
        }
        newDoc.style = new XMLSerializer().serializeToString(styleDoc.documentElement);
    }

    for (const warning of allWarnings) {
        console.warn(warning);
    }
    return newDoc;
}
