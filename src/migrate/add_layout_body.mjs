// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

/**
 * YrtDocument型: 全レイアウトXMLに対してLayoutBody追加変換を適用
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument) {
    const newDoc = structuredClone(yrtDocument);
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        const doc = new DOMParser().parseFromString(entry.xml, "text/xml");
        extractLayoutBody(doc);
        entry.xml = new XMLSerializer().serializeToString(doc);
    }
    // Style XMLにも同じ処理を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(newDoc.style, "text/xml");
        extractLayoutBody(styleDoc);
        newDoc.style = new XMLSerializer().serializeToString(styleDoc);
    }
    return newDoc;
}

function extractLayoutBody(doc) {
    const linearLayouts = Array.from(doc.getElementsByTagName("LinearLayout"));
    for (const layout of linearLayouts) {
        let header = null;
        let body = null;
        let footer = null;
        const others = [];
        for (let j = 0; j < layout.childNodes.length; j++) {
            const node = layout.childNodes[j];
            if (node.nodeType !== 1) continue;
            if (node.nodeName === "LayoutHeader") {
                header = node;
            } else if (node.nodeName === "LayoutBody") {
                body = node;
            } else if (node.nodeName === "LayoutFooter") {
                footer = node;
            } else {
                others.push(node);
                console.warn(`[WARNING] LinearLayout直下にLayoutHeader, LayoutBody, LayoutFooter以外の要素: <${node.nodeName}> が存在します。XPath: ${getXPath(node)}`);
            }
        }
        if (!body) {
            body = doc.createElement("LayoutBody");
        }
        // header/body/footer順で再構成し、その他要素は後ろに追加
        while (layout.firstChild) layout.removeChild(layout.firstChild);
        if (header) layout.appendChild(header);
        layout.appendChild(body);
        if (footer) layout.appendChild(footer);
        for (const node of others) layout.appendChild(node);
    }
}
