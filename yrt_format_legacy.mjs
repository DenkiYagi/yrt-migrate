// @ts-check
// import types:
/** @private @typedef {import("./types").DecodedLegacyYrt} DecodedLegacyYrt */
/** @private @template T @typedef {import("./validation_result.mjs").Result<T>} Result<T> */
/** @private @template T @typedef {import("./validation_result.mjs").SimpleResult<T>} SimpleResult<T> */

import { DOMParser } from "@xmldom/xmldom";
import { success, warning, error } from "./validation_result.mjs";

/**
 * 指定された文字列がXMLであり、かつルート要素が `<LayoutXml>` であることを確認する
 *
 * @param {string} xml
 * @returns {Result<string>}
 */
export function validateLegacyLayoutXml(xml) {
    try {
        const warningMessages = [];
        let errorMessage = null;
        const doc = new DOMParser({
            errorHandler: {
                warning: (msg) => warningMessages.push(msg.toString()),
                error: (msg) => errorMessage = msg,
                fatalError: (msg) => errorMessage = msg,
            }
        }).parseFromString(xml, 'application/xml');
        if (errorMessage != null) {
            return error(`XMLパースエラーが発生しました: ${errorMessage}`);
        }
        if (!doc || !doc.documentElement) {
            return error('XMLパースに失敗しました。');
        }
        if (doc.documentElement.nodeName !== 'LayoutXml') {
            return error('ルート要素が LayoutXml ではありません。');
        }
        if (warningMessages.length > 0) {
            return warning(xml, `XMLパース中に警告が発生しました: ${warningMessages.join(" ; ")}`);
        }
        return success(xml);
    } catch (e) {
        return error(`XMLパースエラーが発生しました: ${e.message}`);
    }
}

/**
 * 旧YRT形式 (v1.0.0-alpha.13) かどうかを判定する
 * 
 * - `decoded` のデータ型が `DecodedLegacyYrt` に合致すること
 * - レイアウトXMLが旧形式であること
 * 
 * @param {unknown} decoded
 * @returns {Result<DecodedLegacyYrt>}
 */
export function validateLegacyYrtFormat(decoded) {
    if (!Array.isArray(decoded)) {
        return error('デコード結果が配列ではありません。');
    }

    if (decoded.length === 1) {
        const [maybeXml] = decoded;
        if (typeof maybeXml !== 'string') {
            return error('最初の要素が文字列ではありません。');
        }
        const xmlValidationResult = validateLegacyLayoutXml(maybeXml);
        if (xmlValidationResult.type === 'error') {
            return error(`レイアウトXMLの検証に失敗しました: ${xmlValidationResult.message}`);
        } else if (xmlValidationResult.type === 'warning') {
            return warning(/** @type {DecodedLegacyYrt} */(decoded), xmlValidationResult.message); // propagate
        }
        return success(/** @type {DecodedLegacyYrt} */(decoded));
    } else if (decoded.length === 2) {
        const [maybeXml, maybeAssets] = decoded;
        if (typeof maybeXml !== 'string') {
            return error('最初の要素が文字列ではありません。');
        }
        if (maybeAssets == null || typeof maybeAssets !== 'object') {
            return error('2番目の要素がオブジェクトではありません。');
        }
        const xmlValidationResult = validateLegacyLayoutXml(maybeXml);
        if (xmlValidationResult.type === 'error') {
            return error(`レイアウトXMLの検証に失敗しました: ${xmlValidationResult.message}`);
        } else if (xmlValidationResult.type === 'warning') {
            return warning(/** @type {DecodedLegacyYrt} */(decoded), xmlValidationResult.message); // propagate
        }
        return success(/** @type {DecodedLegacyYrt} */(decoded));
    } else {
        return error(`配列の要素数が不正です。`);
    }
}

/**
 * 有効なアセット（プロパティーの値がすべて `Uint8Array` であるようなオブジェクト）であることを確認する
 * 
 * ※ アセットオブジェクトの形式は v1.0.0-alpha.13 と v1.0 で共通
 * 
 * @param {unknown} value
 * @returns {SimpleResult<Partial<Record<string, Uint8Array>>>}
 */
export function validateAssetsObject(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return error('アセットオブジェクトのデータ型が不正です。');
    }
    if (value instanceof Map || value instanceof Set) {
        return error('アセットオブジェクトが有効なオブジェクトではありません。');
    }
    for (const [key, v] of Object.entries(value)) {
        if (!(v instanceof Uint8Array)) {
            return error(`アセット "${key}" の値がUint8Arrayではありません。`);
        }
    }

    return success(/** @type {Partial<Record<string, Uint8Array>>} */(value));
}

/**
 * YRTが新フォーマット（マイグレーション済み）かどうか判定
 * - `['YRT', 1, { l: [...], ... }]` 形式であること
 * - `l` 配列の要素が1つ以上存在すること
 *
 * @param {unknown} maybeYrt
 * @returns {SimpleResult<unknown>}
 */
export function validateAlreadyMigrated(maybeYrt) {
    if (!Array.isArray(maybeYrt) || maybeYrt.length < 3) {
        return error('YRT v1.0 の構造ではありません。');
    }
    if (maybeYrt[0] !== 'YRT' || maybeYrt[1] !== 1) {
        return error('YRTのヘッダーが不正です。');
    }
    const body = maybeYrt[2];
    if (!body || typeof body !== 'object') {
        return error('YRTのボディが有効なオブジェクトではありません。');
    }
    if (!Array.isArray(body.l) || body.l.length === 0) {
        return error('YRTのレイアウト配列が存在しないか空です。');
    }

    return success(maybeYrt);
}
