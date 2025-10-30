// @ts-check

import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * 旧仕様のレイアウト属性に関する警告を出力する
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void}
 */
export function migrate(originalDocument, originalXml) {
    warnDeprecatedAttrs(originalDocument.documentElement, originalXml);
}

/**
 * @param {Element} node
 * @param {string} originalXml
 * @returns {void}
 */
function warnDeprecatedAttrs(node, originalXml) {
    if (!node || node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === "LinearLayout") {
        const targets = ["borderThickness", "borderColor", "borderStyle"];
        if (targets.some(attr => node.hasAttribute(attr))) {
            warnWithLocation(originalXml, node, `LinearLayoutのborder系属性（borderThickness, borderColor, borderStyle）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。`);
        }
    } else if (tag === "StackLayout") {
        const targets = ["borderThickness", "borderColor", "borderStyle", "padding"];
        if (targets.some(attr => node.hasAttribute(attr))) {
            warnWithLocation(originalXml, node, `<StackLayout>のborder系属性・padding属性（borderThickness, borderColor, borderStyle, padding）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。`);
        }
    } else if (tag === "StackBlock") {
        if (node.hasAttribute("padding")) {
            warnWithLocation(originalXml, node, `<StackBlock>のpadding属性は廃止されました。レイアウトが変わる可能性があるため手直ししてください。`);
        }
    }
    for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child?.nodeType === 1) {
            warnDeprecatedAttrs(/** @type {Element} */ (child), originalXml);
        }
    }
}
