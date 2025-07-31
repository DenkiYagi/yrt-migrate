import { getXPath } from "./utils.js";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * YRT構造対応: 全レイアウトXMLに対して属性削除・警告を適用
 * @param {any} yrtRoot YRT構造
 * @returns {any} 新しいYRT構造
 */
export function migrate(yrtRoot) {
    const newRoot = JSON.parse(JSON.stringify(yrtRoot));
    const layouts = newRoot[2].l;
    for (let i = 0; i < layouts.length; i++) {
        const [name, xml] = layouts[i];
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        removeAttrsAndWarn(doc.documentElement);
        const newXml = new XMLSerializer().serializeToString(doc.documentElement);
        layouts[i][1] = newXml;
    }
    return newRoot;
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
                `LinearLayoutのborder系属性（borderThickness, borderColor, borderStyle）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。（XPath: ${xpath}）`
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
                `StackLayoutのborder系属性・padding属性（borderThickness, borderColor, borderStyle, padding）は廃止されました。レイアウトが変わる可能性があるため手直ししてください。（XPath: ${xpath}）`
            );
        }
    } else if (tag === "StackBlock") {
        if (node.hasAttribute("padding")) {
            node.removeAttribute("padding");
            const xpath = getXPath(node);
            console.warn(
                `StackBlockのpadding属性は廃止されました。レイアウトが変わる可能性があるため手直ししてください。（XPath: ${xpath}）`
            );
        }
    }
    for (let i = 0; i < node.childNodes.length; i++) {
        removeAttrsAndWarn(node.childNodes[i]);
    }
}
