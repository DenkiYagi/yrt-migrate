// レイアウト変更の可能性のある属性の廃止
// - LinearLayout: borderThickness, borderColor, borderStyle
// - StackLayout: borderThickness, borderColor, borderStyle, padding
// - StackBlock: padding
// 削除時は警告を出す

export function migrate(doc, yrtRoot) {
    removeAttrsAndWarn(doc.documentElement);
    return yrtRoot;
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
