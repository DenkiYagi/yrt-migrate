// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

/**
 * YrtDocument型: 全レイアウトXMLに対して属性削除・警告を適用
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument) {
    const newDoc = structuredClone(yrtDocument);
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        removeAttrsAndWarn(doc.documentElement);
        entry.xml = new XMLSerializer().serializeToString(doc.documentElement);
    }
    // Style XMLにも属性削除・警告処理を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(newDoc.style, "text/xml");
        removeAttrsAndWarn(styleDoc.documentElement);
        newDoc.style = new XMLSerializer().serializeToString(styleDoc.documentElement);
    }
    return newDoc;
}

function removeAttrsAndWarn(node) {
    if (!node || !node.nodeType || node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === "LinearLayout") {
        const targets = ["borderThickness", "borderColor", "borderStyle"];
        const found = targets.filter((attr) => node.hasAttribute(attr));
        if (found.length > 0) {
            found.forEach((attr) => node.removeAttribute(attr));
            const xpath = getXPath(node);
            console.warn(
                `[WARNING] LinearLayoutのborder系属性（borderThickness, borderColor, borderStyle）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。（XPath: ${xpath}）`
            );
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
            const xpath = getXPath(node);
            console.warn(
                `[WARNING] <StackLayout>のborder系属性・padding属性（borderThickness, borderColor, borderStyle, padding）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。（XPath: ${xpath}）`
            );
        }
    } else if (tag === "StackBlock") {
        if (node.hasAttribute("padding")) {
            node.removeAttribute("padding");
            const xpath = getXPath(node);
            console.warn(
                `[WARNING] <StackBlock>のpadding属性は廃止されました。レイアウトが変わる可能性があるため手直ししてください。（XPath: ${xpath}）`
            );
        }
    }
    for (let i = 0; i < node.childNodes.length; i++) {
        removeAttrsAndWarn(node.childNodes[i]);
    }
}
