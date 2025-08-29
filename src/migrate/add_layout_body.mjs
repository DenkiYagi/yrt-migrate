import { DOMParser } from "@xmldom/xmldom";
import { getXPath } from "../utils.js";

/**
 * <LinearLayout> 直下に <LayoutBody> がない場合、
 * <LayoutHeader> <LayoutFooter> 以外の要素を <LayoutBody> で囲む
 * @param {string} xml
 * @returns {string}
 */
/**
 * YRT構造対応: 全レイアウトXMLに対してLayoutBody追加変換を適用
 * @param {any} yrtRoot YRT構造
 * @returns {any} 新しいYRT構造
 */
export function migrate(yrtRoot) {
    const newRoot = structuredClone(yrtRoot);
    const layouts = newRoot[2].l;
    for (let i = 0; i < layouts.length; i++) {
        const [name, xml] = layouts[i];
        const doc = new DOMParser().parseFromString(xml, "text/xml");
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
        const newXml = doc.toString ? doc.toString() : doc.xml ? doc.xml : new XMLSerializer().serializeToString(doc);
        layouts[i][1] = newXml;
    }
    return newRoot;
}
