// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const COLOR_ATTRS = [
    "color",
    "borderColor",
    "outerBorderColor",
    "backgroundColor",
    "headerBackgroundColor",
    "footerBackgroundColor",
];

function toK(val) {
    const m = val.match(/^grayscale\(\s*(\d*\.?\d+)\s*\)$/i);
    if (!m) return null;
    // 0.0→100, 1.0→0
    const v = Math.round((1 - parseFloat(m[1])) * 100);
    return `K${v}`;
}

function toRGB(val) {
    const m = val.match(/^rgb\(\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*\)$/i);
    if (!m) return null;
    const r = Math.round(parseFloat(m[1]) * 100);
    const g = Math.round(parseFloat(m[2]) * 100);
    const b = Math.round(parseFloat(m[3]) * 100);
    return `R${r}G${g}B${b}`;
}

function toCMYK(val) {
    const m = val.match(/^cmyk\(\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\s*\)$/i);
    if (!m) return null;
    const c = Math.round(parseFloat(m[1]) * 100);
    const m_ = Math.round(parseFloat(m[2]) * 100);
    const y = Math.round(parseFloat(m[3]) * 100);
    const k = Math.round(parseFloat(m[4]) * 100);
    return `C${c}M${m_}Y${y}K${k}`;
}

function migrateNode(node) {
    if (node.nodeType !== 1) return;
    for (const attr of COLOR_ATTRS) {
        if (node.hasAttribute(attr)) {
            const val = node.getAttribute(attr).trim();
            const colorPattern = /(grayscale\([^)]*\)|rgb\([^)]*\)|cmyk\([^)]*\))/gi;
            const matches = val.match(colorPattern);
            if (matches && matches.length > 1) {
                // 複数マッチ → 個別変換
                const converted = matches.map(v => toK(v) || toRGB(v) || toCMYK(v) || v);
                node.setAttribute(attr, converted.join(' '));
            } else {
                // 単一値 or マッチなし → そのまま変換
                let newVal = toK(val) || toRGB(val) || toCMYK(val);
                if (newVal) node.setAttribute(attr, newVal);
            }
        }
    }
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            migrateNode(node.childNodes[i]);
        }
    }
}

/**
 * YrtDocument型の各layouts[].xmlにIllustrator寄りのカラー記法変換を適用する
 * @param {import("../yrt_format.js").YrtDocument} yrtDocument - 変換対象のYrtDocument
 * @returns {import("../yrt_format.js").YrtDocument} 変換後のYrtDocument
 */
export function migrate(yrtDocument) {
    if (!yrtDocument || !Array.isArray(yrtDocument.layouts)) return yrtDocument;
    const migratedLayouts = yrtDocument.layouts.map(layoutEntry => {
        if (!layoutEntry || typeof layoutEntry.xml !== "string") return layoutEntry;
        const doc = new DOMParser().parseFromString(layoutEntry.xml, "text/xml");
        migrateNode(doc.documentElement);
        return { ...layoutEntry, xml: new XMLSerializer().serializeToString(doc) };
    });
    // Style XMLにも同様の処理を適用
    let migratedStyle = yrtDocument.style;
    if (typeof migratedStyle === "string" && migratedStyle.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(migratedStyle, "text/xml");
        migrateNode(styleDoc.documentElement);
        migratedStyle = new XMLSerializer().serializeToString(styleDoc);
    }
    return { ...yrtDocument, layouts: migratedLayouts, style: migratedStyle };
}
