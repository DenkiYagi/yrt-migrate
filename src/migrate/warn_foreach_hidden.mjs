// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * @param {string | null | undefined} val
 * @returns {boolean}
 */
function isBindingVariable(val) {
    return typeof val === "string" && /\$\{[^}]+\}/.test(val);
}

/**
 * @param {Element} el
 * @param {string} originalXml
 * @returns {void}
 */
function warnElement(el, originalXml) {
    if (!el || !el.getAttribute) return;
    let foreach = el.getAttribute("foreach")?.trim();
    let hidden = el.getAttribute("hidden")?.trim();

    if (foreach && hidden) {
        warnWithLocation(originalXml, el, `foreach属性とhidden属性が同時に指定されているため自動変換できません。手動で修正してください。`);
    }
    if (foreach && !isBindingVariable(foreach)) {
        warnWithLocation(originalXml, el, `foreach属性の値 "${foreach}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。`);
    }
    if (hidden && !isBindingVariable(hidden)) {
        warnWithLocation(originalXml, el, `hidden属性の値 "${hidden}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。`);
    }

    if (el.childNodes) {
        for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child?.nodeType === 1) {
                warnElement(/** @type {Element} */ (child), originalXml);
            }
        }
    }
}

/**
 * foreach/hidden 属性に関する警告のみを実行
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @param {string} originalXml
 * @returns {void}
 */
export function migrate(yrtDocument, originalXml) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return;
    for (const entry of yrtDocument.layouts) {
        if (!entry || typeof entry.xml !== "string") continue;
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        if (doc?.documentElement) {
            warnElement(doc.documentElement, originalXml);
        }
    }
    if (typeof yrtDocument.style === "string" && yrtDocument.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(yrtDocument.style, "text/xml");
        if (styleDoc?.documentElement) {
            warnElement(styleDoc.documentElement, originalXml);
        }
    }
}
