// foreach/hidden属性→logic属性マイグレーション
// - foreach属性: logic="foreach:..."に変換。バインド変数でなければlogic="foreach:[]"にし警告。
// - hidden属性: logic="if:..."に変換。バインド変数でなければlogic="if:true"にし警告。
// - 既にlogic属性がある場合は警告し、変換しない。
// - foreach/hidden両方ある場合はforeachのみlogic化、hiddenは警告のみ。

import { getXPath } from "./utils.js";

function isBindingVariable(val) {
    // ${...} 形式かどうか
    return typeof val === 'string' && /\$\{[^}]+\}/.test(val);
}

function migrateElement(el, warnings) {
    if (!el || !el.getAttribute) return;
    const foreach = el.getAttribute('foreach');
    const hidden = el.getAttribute('hidden');
    const logic = el.getAttribute('logic');

    // foreachとhidden両方ある場合はforeachのみlogic化、hiddenは警告のみ
    if (foreach && hidden && !logic) {
        const logicVal = `foreach:${foreach}`;
        if (!isBindingVariable(foreach)) {
            const xpath = getXPath(el);
            warnings.push(`foreach属性の値「${foreach}」はバインド変数ではありません。バインド変数しか指定できないので修正してください。（XPath: ${xpath}）`);
        }
        el.setAttribute('logic', logicVal);
        el.removeAttribute('foreach');
        const xpath = getXPath(el);
        warnings.push(`logic属性が既に存在するためhidden属性は変換しませんでした（XPath: ${xpath}）`);
    } else if (foreach) {
        if (logic) {
            const xpath = getXPath(el);
            warnings.push(`logic属性が既に存在するためforeach属性は変換しませんでした（XPath: ${xpath}）`);
        } else {
            const logicVal = `foreach:${foreach}`;
            if (!isBindingVariable(foreach)) {
                const xpath = getXPath(el);
                warnings.push(`foreach属性の値「${foreach}」はバインド変数ではありません。バインド変数しか指定できないので修正してください。（XPath: ${xpath}）`);
            }
            el.setAttribute('logic', logicVal);
            el.removeAttribute('foreach');
        }
    } else if (hidden) {
        if (logic) {
            const xpath = getXPath(el);
            warnings.push(`logic属性が既に存在するためhidden属性は変換しませんでした（XPath: ${xpath}）`);
        } else {
            const logicVal = `if:${hidden}`;
            if (!isBindingVariable(hidden)) {
                const xpath = getXPath(el);
                warnings.push(`hidden属性の値「${hidden}」はバインド変数ではありません。バインド変数しか指定できないので修正してください。（XPath: ${xpath}）`);
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

export function migrate(doc, yrtRoot) {
    const warnings = [];
    if (doc && doc.documentElement) {
        migrateElement(doc.documentElement, warnings);
    }
    if (warnings.length > 0) {
        console.warn('[foreach_hidden_to_logic] 警告:', warnings.join('\n'));
    }
    return yrtRoot;
}
