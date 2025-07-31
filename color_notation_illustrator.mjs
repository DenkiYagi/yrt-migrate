// Illustrator寄りのカラー記法に変換するマイグレーション
// color, borderColor, outerBorderColor, backgroundColor属性を対象

const COLOR_ATTRS = [
    "color",
    "borderColor",
    "outerBorderColor",
    "backgroundColor",
];

function toK(val) {
    const m = val.match(/^grayscale\((\d*\.?\d+)\)$/);
    if (!m) return null;
    // 0.0→100, 1.0→0
    const v = Math.round((1 - parseFloat(m[1])) * 100);
    return `K${v}`;
}

function toRGB(val) {
    const m = val.match(/^rgb\((\d*\.?\d+),(\d*\.?\d+),(\d*\.?\d+)\)$/);
    if (!m) return null;
    const r = Math.round(parseFloat(m[1]) * 100);
    const g = Math.round(parseFloat(m[2]) * 100);
    const b = Math.round(parseFloat(m[3]) * 100);
    return `R${r}G${g}B${b}`;
}

function toCMYK(val) {
    const m = val.match(/^cmyk\((\d*\.?\d+),(\d*\.?\d+),(\d*\.?\d+),(\d*\.?\d+)\)$/);
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
            const val = node.getAttribute(attr);
            let newVal = null;
            newVal = toK(val) || toRGB(val) || toCMYK(val);
            if (newVal) node.setAttribute(attr, newVal);
        }
    }
    if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
            migrateNode(node.childNodes[i]);
        }
    }
}

export function migrate(doc) {
    if (!doc || !doc.documentElement) return;
    migrateNode(doc.documentElement);
}
