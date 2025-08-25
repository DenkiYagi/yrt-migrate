/**
 * 任意の値をUint8Arrayに変換する
 * @param {any} val
 * @returns {Uint8Array}
 */
export function toUint8Array(val) {
    // Buffer型はUint8Arrayのサブクラスなので先に判定
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(val)) {
        return new Uint8Array(val.buffer, val.byteOffset, val.byteLength);
    }
    if (val instanceof Uint8Array) return val;
    if (val instanceof ArrayBuffer) return new Uint8Array(val);
    if (Array.isArray(val)) return new Uint8Array(val);
    if (val && typeof val === 'object' && val.type === 'Buffer' && Array.isArray(val.data)) {
        return new Uint8Array(val.data);
    }
    if (typeof val === 'string') {
        // 簡易的なBase64判定: 4の倍数長・A-Za-z0-9+/=のみ
        if (val.length % 4 === 0 && /^[A-Za-z0-9+/=]+$/.test(val)) {
            try {
                return new Uint8Array(Buffer.from(val, 'base64'));
            } catch {
                return null;
            }
        }
        return null;
    }
    // 不明な型はnull返却
    return null;
}

/**
 * YRTが新フォーマット（マイグレーション済み）かどうか判定
 * - ['YRT', 1, { l: [...], ... }] 形式であること
 * - l配列が1つ以上存在すること
 * - 旧フォーマット特有のLayoutXmlキーが存在しないこと
 * @param {any} yrtRoot
 * @returns {boolean}
 */
export function isAlreadyMigrated(yrtRoot) {
    if (!Array.isArray(yrtRoot) || yrtRoot.length < 3) return false;
    const obj = yrtRoot[2];
    if (!obj || typeof obj !== 'object') return false;
    // layouts配列が1つ以上
    if (!Array.isArray(obj.l) || obj.l.length === 0) return false;
    // 旧フォーマットはLayoutXmlキーが必ず存在する
    if (Object.prototype.hasOwnProperty.call(obj, 'LayoutXml')) {
        return false;
    }
    return true;
}

/**
 * YRT構造から { layouts, styleXml, assets } を抽出するユーティリティ
 * @param {any[]} yrtRoot
 * @returns {{ layouts: string[], styleXml: string|null, assets: any|null }}
 */
export function fromYrtRoot(yrtRoot) {
    if (!Array.isArray(yrtRoot) || yrtRoot.length < 3 || !yrtRoot[2]) {
        throw new Error("fromYrtRoot: 入力がYRT構造ではありません");
    }
    const layouts = (yrtRoot[2].l || []).map(pair => pair[1]);
    const styleXml = yrtRoot[2].s ?? null;
    const assets = yrtRoot[2].a ?? null;
    return { layouts, styleXml, assets };
}

/**
 * YRT構造を生成するユーティリティ関数
 * @param {Object} params
 * @param {string[]} params.layouts - レイアウトXML文字列の配列
 * @param {string|null} [params.styleXml=null] - スタイルXML文字列（省略可）
 * @param {any} [params.assets=null] - アセット（省略可）
 * @returns {any[]} YRT構造
 */
export function toYrtRoot({ layouts, styleXml = null, assets = null }) {
    return ["YRT", 1, { l: layouts.map(xml => [null, xml]), s: styleXml, a: assets }];
}

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
