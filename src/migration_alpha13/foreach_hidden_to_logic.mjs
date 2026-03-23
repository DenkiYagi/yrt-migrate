// @ts-check

import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

/**
 * @param {string} val
 * @returns {boolean}
 */
function isBindingVariable(val) {
    // ${...} 形式かどうか
    return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

/**
 * @param {any} el
 */
function migrateElement(el) {
    if (!el || !el.getAttribute) return;
    let foreach = el.getAttribute('foreach')?.trim();
    let hidden = el.getAttribute('hidden')?.trim();

    // まず値なしのパターンを処理
    if (foreach === "") {
        el.removeAttribute('foreach');
        foreach = null;
    }
    if (hidden === "") {
        el.removeAttribute('hidden');
        hidden = null;
    }

    const canConvertForeach = foreach && !hidden && isBindingVariable(foreach);
    const canConvertHidden = hidden && !foreach && isBindingVariable(hidden);

    if (canConvertForeach) {
        const logicVal = `foreach:${foreach}`;
        el.setAttribute('logic', logicVal);
        el.removeAttribute('foreach');
    } else if (canConvertHidden) {
        const logicVal = `if:${hidden.replace(/\$\{([^}]+)\}/, '${!$1}')}`;
        el.setAttribute('logic', logicVal);
        el.removeAttribute('hidden');
    }
    // 子要素を再帰的に処理
    if (el.childNodes) {
        for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child.nodeType === 1) { // ELEMENT_NODE
                migrateElement(child);
            }
        }
    }
}

/**
 * レイアウト・スタイルにforeach/hidden→logic変換を適用する
 * @param {import('./yrt_format.js').MigratedXmlCollection} yrtDocument
 * @returns {import('./yrt_format.js').MigratedXmlCollection} 変換後のコレクション
 */
export function migrate(yrtDocument) {
    const newLayouts = yrtDocument.layouts.map(xml => {
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        if (doc && doc.documentElement) {
            migrateElement(doc.documentElement);
        }
        return new XMLSerializer().serializeToString(doc.documentElement);
    });

    // Style XMLにも同様の変換を適用
    let newStyle = yrtDocument.style ?? null;
    if (typeof newStyle === "string" && newStyle.trim().length > 0) {
        const styleDoc = new DOMParser().parseFromString(newStyle, "text/xml");
        if (styleDoc && styleDoc.documentElement) {
            migrateElement(styleDoc.documentElement);
        }
        newStyle = new XMLSerializer().serializeToString(styleDoc.documentElement);
    }

    return {
        layouts: newLayouts,
        style: newStyle,
    };
}
