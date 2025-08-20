import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

export function migrate(yrtRoot) {
    const newRoot = structuredClone(yrtRoot);
    const layouts = newRoot[2].l;
    for (let i = 0; i < layouts.length; i++) {
        const [name, xml] = layouts[i];
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        // 再帰的に全要素を走査
        function removeUnspecifiedAttrs(node) {
            if (node.nodeType !== 1) return;
            // すべての属性をチェック
            const attrs = Array.from(node.attributes);
            for (const attr of attrs) {
                if (attr.value === "unspecified") {
                    node.removeAttribute(attr.name);
                }
            }
            // 子要素も再帰
            for (let child = node.firstChild; child; child = child.nextSibling) {
                removeUnspecifiedAttrs(child);
            }
        }
        removeUnspecifiedAttrs(doc.documentElement);
        const newXml = new XMLSerializer().serializeToString(doc);
        layouts[i][1] = newXml;
    }
    return newRoot;
}
