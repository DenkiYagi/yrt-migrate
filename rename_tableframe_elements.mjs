import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * <TableFrame>関連要素をFrame系要素にリネームする
 * @param {string} xml
 * @returns {string}
 */
export function migrate(xml) {
    const doc = new DOMParser().parseFromString(xml, "text/xml");
    // 変換対象のタグ名と新しいタグ名の対応表
    const renameMap = {
        TableFrame: "Frame",
        TableHeader: "FrameHeader",
        TablePageHeader: "FramePageHeader",
        TablePageFooter: "FramePageFooter",
        TableFooter: "FrameFooter",
    };
    // 再帰的に全ノードを探索してリネーム
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
    rename(doc);
    return new XMLSerializer().serializeToString(doc);
}
