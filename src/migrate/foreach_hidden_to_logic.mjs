// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

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
 * @param {string} originalXml
 */
function migrateElement(el, originalXml) {
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

    // foreachとhidden両方ある場合は自動変換できないため警告のみ
    if (foreach && hidden) {
        warnWithLocation(originalXml, el, `foreach属性とhidden属性が同時に指定されているため自動変換できません。手動で修正してください。`);
        if (!isBindingVariable(foreach)) {
            warnWithLocation(originalXml, el, `foreach属性の値 "${foreach}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。`);
        }
        return;
    } else if (foreach) {
        const logicVal = `foreach:${foreach}`;
        if (!isBindingVariable(foreach)) {
            warnWithLocation(originalXml, el, `foreach属性の値 "${foreach}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。`);
        }
        el.setAttribute('logic', logicVal);
        el.removeAttribute('foreach');
    } else if (hidden) {
        // 真偽値を反転してlogic属性に変換
        let logicVal;
        if (isBindingVariable(hidden)) {
            // ${...} の場合は ! を付与
            logicVal = `if:${hidden.replace(/\$\{([^}]+)\}/, '${!$1}')}`;
        } else {
            // それ以外はそのまま
            logicVal = `if:${hidden}`;
        }
        if (!isBindingVariable(hidden)) {
            warnWithLocation(originalXml, el, `hidden属性の値 "${hidden}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。`);
        }
        el.setAttribute('logic', logicVal);
        el.removeAttribute('hidden');
    }
    // 子要素を再帰的に処理
    if (el.childNodes) {
        for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child.nodeType === 1) { // ELEMENT_NODE
                migrateElement(child, originalXml);
            }
        }
    }
}

/**
 * YrtDocument型: 全レイアウトXMLに対してforeach/hidden→logic変換を適用
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @param {string} originalXml - 変換前のXML文字列（警告出力用）
 * @returns {import('../yrt_format.js').YrtDocument} 変換後のYrtDocument
 */
export function migrate(yrtDocument, originalXml) {
    const newDoc = structuredClone(yrtDocument);
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        if (doc && doc.documentElement) {
            migrateElement(doc.documentElement, originalXml);
        }
        entry.xml = new XMLSerializer().serializeToString(doc.documentElement);
    }

    // Style XMLにも同様の変換を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(newDoc.style, "text/xml");
        if (styleDoc && styleDoc.documentElement) {
            migrateElement(styleDoc.documentElement, originalXml);
        }
        newDoc.style = new XMLSerializer().serializeToString(styleDoc.documentElement);
    }
    return newDoc;
}
