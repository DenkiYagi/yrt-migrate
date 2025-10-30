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
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Element} el
 * @param {string} originalXml
 * @returns {void}
 */
function warnElement(diagnostics, el, originalXml) {
    if (!el.getAttribute) return;
    let foreach = el.getAttribute("foreach")?.trim();
    let hidden = el.getAttribute("hidden")?.trim();

    if (foreach && hidden) {
        warnWithLocation(diagnostics, originalXml, el, [
            "foreach属性とhidden属性は廃止され、新たにlogic属性が導入されました。",
            "foreach属性とhidden属性が同時に指定されている場合は自動変換できません。",
            "レイアウトXMLおよびバインディングデータを手動で修正してください。"
        ]);
    }
    if (foreach && !isBindingVariable(foreach)) {
        warnWithLocation(diagnostics, originalXml, el, [
            "foreach属性は廃止され、新たにlogic属性が導入されました。",
            `foreach属性の値 "${foreach}" がバインド変数ではないため、自動変換できません。`,
            "バインド変数を指定してください。"
        ]);
    }
    if (hidden && !isBindingVariable(hidden)) {
        warnWithLocation(diagnostics, originalXml, el, [
            "hidden属性は廃止され、新たにlogic属性が導入されました。",
            `hidden属性の値 "${hidden}" がバインド変数ではないため、自動変換できません。`,
            "バインド変数を指定してください。"
        ]);
    }

    if (el.childNodes) {
        for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child?.nodeType === 1) {
                warnElement(diagnostics, /** @type {Element} */(child), originalXml);
            }
        }
    }
}

/**
 * foreach/hidden 属性に関する警告を実行
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void}
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    warnElement(diagnostics, originalDocument.documentElement, originalXml);
}
