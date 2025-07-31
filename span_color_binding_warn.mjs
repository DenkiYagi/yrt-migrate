import { getXPath } from "./utils.js";

function isBinding(val) {
    return typeof val === "string" && /^\$\{[^}]+\}$/.test(val);
}

function checkSpan(node) {
    if (node.nodeType === 1 && node.nodeName === "Span") {
        const color = node.getAttribute("color");
        if (isBinding(color)) {
            const xpath = getXPath(node);
            console.warn(`<Span>のcolor属性にバインド変数は指定できません (値: ${color}) @ ${xpath}`);
        }
    }
    // 子要素も再帰的にチェック
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            checkSpan(node.childNodes[i]);
        }
    }
}

export function migrate(doc) {
    checkSpan(doc.documentElement);
}
