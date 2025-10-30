// @ts-check

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
    if (!el.getAttribute) return;
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
 * foreach/hidden 属性に関する警告を実行
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void}
 */
export function migrate(originalDocument, originalXml) {
    warnElement(originalDocument.documentElement, originalXml);
}
