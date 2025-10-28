// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * YrtDocument型: 全レイアウトXMLに対して属性削除・警告を適用
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @param {string} originalXml 元のXML文字列
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument, originalXml) {
    const newDoc = structuredClone(yrtDocument);
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        removeAttrsAndWarn(doc.documentElement, originalXml);
        entry.xml = new XMLSerializer().serializeToString(doc.documentElement);
    }
    // Style XMLにも属性削除・警告処理を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(newDoc.style, "text/xml");
        removeAttrsAndWarn(styleDoc.documentElement, originalXml);
        newDoc.style = new XMLSerializer().serializeToString(styleDoc.documentElement);
    }
    return newDoc;
}

/**
 * @param {Element} node
 * @param {string} originalXml
 */
function removeAttrsAndWarn(node, originalXml) {
    if (!node || !node.nodeType || node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === "LinearLayout") {
        const targets = ["borderThickness", "borderColor", "borderStyle"];
        const found = targets.filter((attr) => node.hasAttribute(attr));
        if (found.length > 0) {
            found.forEach((attr) => node.removeAttribute(attr));
            warnWithLocation(originalXml, node, `LinearLayoutのborder系属性（borderThickness, borderColor, borderStyle）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。`);
        }
    } else if (tag === "StackLayout") {
        const targets = [
            "borderThickness",
            "borderColor",
            "borderStyle",
            "padding",
        ];
        const found = targets.filter((attr) => node.hasAttribute(attr));
        if (found.length > 0) {
            found.forEach((attr) => node.removeAttribute(attr));
            warnWithLocation(originalXml, node, `<StackLayout>のborder系属性・padding属性（borderThickness, borderColor, borderStyle, padding）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。`);
        }
    } else if (tag === "StackBlock") {
        if (node.hasAttribute("padding")) {
            node.removeAttribute("padding");
            warnWithLocation(originalXml, node, `<StackBlock>のpadding属性は廃止されました。レイアウトが変わる可能性があるため手直ししてください。`);
        }
    }
    for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === 1) {
            removeAttrsAndWarn(/** @type {Element} */(child), originalXml);
        }
    }
}
