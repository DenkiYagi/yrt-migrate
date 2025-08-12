import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { getXPath } from "./utils.js";

function isBindingVariable(val) {
    // ${...} 形式かどうか
    return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

function migrateElement(el, warnings) {
    if (!el || !el.getAttribute) return;
    let foreach = el.getAttribute('foreach')?.trim();
    let hidden = el.getAttribute('hidden')?.trim();
    const logic = el.getAttribute('logic')?.trim();

    // まず値なしのパターンを処理
    if (foreach === "") {
        el.removeAttribute('foreach');
        foreach = null;
    }
    if (hidden === "") {
        el.removeAttribute('hidden');
        hidden = null;
    }

    // foreachとhidden両方ある場合はforeachのみlogic化、hiddenは警告のみ
    if (foreach && hidden && !logic) {
        const logicVal = `foreach:${foreach}`;
        if (!isBindingVariable(foreach)) {
            const xpath = getXPath(el);
            warnings.push(`[WARNING] foreach属性の値 "${foreach}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。（XPath: ${xpath}）`);
        }
        el.setAttribute('logic', logicVal);
        el.removeAttribute('foreach');
        const xpath = getXPath(el);
        warnings.push(`[WARNING] logic属性が既に存在するためhidden属性は変換しませんでした（XPath: ${xpath}）`);
    } else if (foreach) {
        if (logic) {
            const xpath = getXPath(el);
            warnings.push(`[WARNING] logic属性が既に存在するためforeach属性は変換しませんでした（XPath: ${xpath}）`);
        } else {
            const logicVal = `foreach:${foreach}`;
            if (!isBindingVariable(foreach)) {
                const xpath = getXPath(el);
                warnings.push(`[WARNING] foreach属性の値 "${foreach}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。（XPath: ${xpath}）`);
            }
            el.setAttribute('logic', logicVal);
            el.removeAttribute('foreach');
        }
    } else if (hidden) {
        if (logic) {
            const xpath = getXPath(el);
            warnings.push(`[WARNING] logic属性が既に存在するためhidden属性は変換しませんでした（XPath: ${xpath}）`);
        } else {
            const logicVal = `if:${hidden}`;
            if (!isBindingVariable(hidden)) {
                const xpath = getXPath(el);
                warnings.push(`[WARNING] hidden属性の値 "${hidden}" はバインド変数ではありません。バインド変数しか指定できないので修正してください。（XPath: ${xpath}）`);
            }
            el.setAttribute('logic', logicVal);
            el.removeAttribute('hidden');
        }
    }
    // 子要素を再帰的に処理
    if (el.childNodes) {
        for (let i = 0; i < el.childNodes.length; i++) {
            const child = el.childNodes[i];
            if (child.nodeType === 1) { // ELEMENT_NODE
                migrateElement(child, warnings);
            }
        }
    }
}

/**
 * YRT構造対応: 全レイアウトXMLに対してforeach/hidden→logic変換を適用
 * @param {any} yrtRoot YRT構造
 * @returns {any} 新しいYRT構造
 */
export function migrate(yrtRoot) {
    const newRoot = JSON.parse(JSON.stringify(yrtRoot));
    const layouts = newRoot[2].l;
    let allWarnings = [];
    for (let i = 0; i < layouts.length; i++) {
        const [name, xml] = layouts[i];
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        const warnings = [];
        if (doc && doc.documentElement) {
            migrateElement(doc.documentElement, warnings);
        }
        if (warnings.length > 0) {
            allWarnings = allWarnings.concat(warnings);
        }
        const newXml = new XMLSerializer().serializeToString(doc.documentElement);
        layouts[i][1] = newXml;
    }
    for (const warning of allWarnings) {
        console.warn(warning);
    }
    return newRoot;
}
