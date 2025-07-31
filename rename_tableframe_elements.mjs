import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * <TableFrame>関連要素をFrame系要素にリネームする（YRT構造対応）
 * @param {object} yrtRoot - { l: layouts, ... }
 * @returns {object} - 変換後のYRTルート構造
 */
export function migrate(yrtRoot) {
    // YRT配列形式 or オブジェクト形式どちらでも対応
    const yrtObj = Array.isArray(yrtRoot) && yrtRoot[0] === "YRT" ? yrtRoot[2] : yrtRoot;
    const { l: layouts = [], ...rest } = yrtObj;
    const renameMap = {
        TableFrame: "Frame",
        TableHeader: "FrameHeader",
        TablePageHeader: "FramePageHeader",
        TablePageFooter: "FramePageFooter",
        TableFooter: "FrameFooter",
    };
    function rename(node) {
        if (node.nodeType === 1 && renameMap[node.nodeName]) {
            node.tagName = renameMap[node.nodeName];
            node.nodeName = renameMap[node.nodeName];
        }
        if (!node.childNodes) return;
        for (let i = 0; i < node.childNodes.length; i++) {
            rename(node.childNodes[i]);
        }
    }
    const migratedLayouts = layouts.map(([_, xml]) => {
        if (!xml) return [null, xml];
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        if (!doc || !doc.documentElement) return [null, xml];
        rename(doc.documentElement);
        return [null, new XMLSerializer().serializeToString(doc)];
    });
    if (Array.isArray(yrtRoot) && yrtRoot[0] === "YRT") {
        return ["YRT", 1, { ...rest, l: migratedLayouts }];
    } else {
        return { ...yrtRoot, l: migratedLayouts };
    }
}
