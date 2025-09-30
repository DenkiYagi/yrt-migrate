// @ts-check

import { DOMParser } from "@xmldom/xmldom";
import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * YrtDocument型: 全レイアウトXMLに対してLayoutBody追加変換を適用
 * @param {import('../yrt_format.js').YrtDocument} yrtDocument
 * @param {string} originalXml 元のXML文字列
 * @returns {import('../yrt_format.js').YrtDocument}
 */
export function migrate(yrtDocument, originalXml) {
    const newDoc = structuredClone(yrtDocument);
    for (let i = 0; i < newDoc.layouts.length; i++) {
        const entry = newDoc.layouts[i];
        entry.xml = extractLayoutBody(entry.xml, originalXml);
    }
    // Style XMLにも同じ処理を適用
    if (typeof newDoc.style === "string" && newDoc.style.trim().length > 0) {
        newDoc.style = extractLayoutBody(newDoc.style, originalXml);
    }
    return newDoc;
}

/**
 * @param {string} xml
 * @param {string} originalXml
 * @returns {string}
 */
export function extractLayoutBody(xml, originalXml) {
    const layoutMatch = xml.match(/<LinearLayout([^>]*)>([\s\S]*?)<\/LinearLayout>/);
    if (!layoutMatch) return xml;
    const attrs = layoutMatch[1];
    const inner = layoutMatch[2];

    if (/<LayoutBody[\s>]/.test(inner)) return xml;

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
    const others = [];
    for (const child of children) {
        if (/<LayoutHeader[\s>]/.test(child)) {
            headers.push(child);
        } else if (/<LayoutFooter[\s>]/.test(child)) {
            footers.push(child);
        } else if (/<LayoutBody[\s>]/.test(child)) {
            // 既存のLayoutBody（この分岐は本来不要だが保険）
        } else if (/^\s*$/.test(child)) {
            // 空白は無視
        } else {
            others.push(child);
        }
    }

    if (others.length > 0 && others.some(e => e.trim())) {
        try {
            const doc = new DOMParser().parseFromString(xml, 'application/xml');
            const linearNode = doc.getElementsByTagName('LinearLayout')[0];
            if (linearNode) {
                warnWithLocation(originalXml, linearNode, 'add_layout_body: LayoutXxx系以外の要素がありました。手動で修正してください。');
            } else {
                console.error('add_layout_body: LayoutXxx系以外の要素がありましたがLinearLayoutノードが特定できませんでした。');
            }
        } catch (e) {
            console.error('add_layout_body: LayoutXxx系以外の要素がありましたがXMLパースに失敗しました。');
        }
    }

    const layoutBody = `<LayoutBody></LayoutBody>`;

    const result = `<LinearLayout${attrs}>${headers.join('')}${layoutBody}${footers.join('')}${others.join('')}</LinearLayout>`;
    return xml.replace(/<LinearLayout([^>]*)>[\s\S]*?<\/LinearLayout>/, result);
}
