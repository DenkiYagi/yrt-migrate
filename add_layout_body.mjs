import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

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
    const newRoot = JSON.parse(JSON.stringify(yrtRoot));
    const layouts = newRoot[2].l;
    for (let i = 0; i < layouts.length; i++) {
        const [name, xml] = layouts[i];
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const linearLayouts = Array.from(doc.getElementsByTagName("LinearLayout"));
        for (const layout of linearLayouts) {
            // 直下に <LayoutBody> があれば何もしない
            const hasBody = Array.from(layout.childNodes).some(
                (n) => n.nodeType === 1 && n.nodeName === "LayoutBody"
            );
            if (hasBody) continue;
            // 直下の要素を分類
            const headerNodes = [];
            const footerNodes = [];
            const bodyNodes = [];
            for (let j = 0; j < layout.childNodes.length; j++) {
                const node = layout.childNodes[j];
                if (node.nodeType !== 1) continue;
                if (node.nodeName === "LayoutHeader") {
                    headerNodes.push(node);
                } else if (node.nodeName === "LayoutFooter") {
                    footerNodes.push(node);
                } else {
                    bodyNodes.push(node);
                }
            }
            if (bodyNodes.length === 0) continue;
            // bodyNodes を <LayoutBody> で包む
            const layoutBody = doc.createElement("LayoutBody");
            for (const node of bodyNodes) {
                layoutBody.appendChild(node);
            }
            // header, body, footer の順で再構成
            // まず全ての子要素を削除
            while (layout.firstChild) layout.removeChild(layout.firstChild);
            for (const node of headerNodes) layout.appendChild(node);
            layout.appendChild(layoutBody);
            for (const node of footerNodes) layout.appendChild(node);
        }
        const newXml = new XMLSerializer().serializeToString(doc);
        layouts[i][1] = newXml;
    }
    return newRoot;
}
