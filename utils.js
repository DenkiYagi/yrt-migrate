import xmlFormat from "xml-formatter";

// XMLノードのXPathを取得するユーティリティ
export function getXPath(node) {
    let path = '';
    let current = node;
    while (current && current.nodeType === 1) {
        let name = current.nodeName;
        let parent = current.parentNode;
        if (parent) {
            // 同じタグ名の兄弟の中で何番目か
            let sameTagSiblings = Array.from(parent.childNodes).filter(
                n => n.nodeType === 1 && n.nodeName === name
            );
            if (sameTagSiblings.length > 1) {
                let idx = sameTagSiblings.indexOf(current) + 1;
                name += `[${idx}]`;
            }
        }
        path = '/' + name + path;
        current = parent && parent.nodeType === 1 ? parent : null;
    }
    return path;
}

export function formatXml(xml) {
    // xml-formatter を使って2スペースインデントで整形
    return xmlFormat(xml, { indentation: "  " });
}
