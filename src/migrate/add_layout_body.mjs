// @ts-check

/**
 * YrtDocument型: 全レイアウトXMLに対してLayoutBody追加変換を適用
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument) {
    const newDoc = structuredClone(yrtDocument);
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        entry.xml = extractLayoutBody(entry.xml);
    }
    // Style XMLにも同じ処理を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        newDoc.style = extractLayoutBody(newDoc.style);
    }
    return newDoc;
}

/**
 * @param {string} xml
 * @returns {string}
 */
export function extractLayoutBody(xml) {
    const selfClosingMatch = xml.match(/<LinearLayout\b([^>]*)\/>/);
    if (selfClosingMatch) {
        const attrs = selfClosingMatch[1].replace(/\s+$/, "");
        const layoutBody = `<LayoutBody></LayoutBody>`;
        return xml.replace(/<LinearLayout\b([^>]*)\/>/, `<LinearLayout${attrs}>${layoutBody}</LinearLayout>`);
    }

    const layoutMatch = xml.match(/<LinearLayout\b([^>]*)>([\s\S]*?)<\/LinearLayout>/);
    if (!layoutMatch) return xml;
    const attrs = layoutMatch[1];
    const inner = layoutMatch[2];

    if (/<LayoutBody\b[\s>]/.test(inner)) return xml;

    const childRegex = /(\s*)(<([A-Za-z0-9]+)[^>]*>[\s\S]*?<\/\3>)(\s*)/g;
    let children = [];
    let lastIndex = 0;
    let match;
    while ((match = childRegex.exec(inner)) !== null) {
        if (match.index > lastIndex) {
            children.push(inner.slice(lastIndex, match.index));
        }
        children.push(match[1] + match[2] + match[4]);
        lastIndex = childRegex.lastIndex;
    }
    if (lastIndex < inner.length) {
        children.push(inner.slice(lastIndex));
    }

    const headers = [];
    const footers = [];
    for (const child of children) {
        if (/<LayoutHeader\b[\s>]/.test(child)) {
            headers.push(child);
        } else if (/<LayoutFooter\b[\s>]/.test(child)) {
            footers.push(child);
        } else if (/<LayoutBody\b[\s>]/.test(child)) {
            // 既存のLayoutBody（この分岐は本来不要だが保険）
        } else if (/^\s*$/.test(child)) {
            // 空白は無視
        } else {
            const snippet = child.trim().slice(0, 100);
            throw new Error(`add_layout_body: LinearLayout has unexpected child element: ${snippet}`);
        }
    }

    const layoutBody = `<LayoutBody></LayoutBody>`;

    const result = `<LinearLayout${attrs}>${headers.join('')}${layoutBody}${footers.join('')}</LinearLayout>`;
    return xml.replace(/<LinearLayout\b([^>]*)>[\s\S]*?<\/LinearLayout>/, result);
}
