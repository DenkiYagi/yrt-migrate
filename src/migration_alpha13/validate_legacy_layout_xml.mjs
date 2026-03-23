// @ts-check
/** @private @template T @typedef {import("../validation_result.mjs").Result<T>} Result<T> */

import { DOMParser } from "@xmldom/xmldom";
import { success, warning, error } from "../validation_result.mjs";

/**
 * 指定された文字列がXMLであり、かつルート要素が `<LayoutXml>` であることを確認する
 *
 * @param {string} xml
 * @returns {Result<string>}
 */
export function validateLegacyLayoutXml(xml) {
    try {
        /** @type {string[]} */
        const warningMessages = [];
        let errorMessage = null;
        // NOTE: @xmldom/xmldom の最新バージョンでは errorHandler が deprecated になる可能性があるので注意
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
        const err = /** @type {any} */ (e);
        return error(`XMLパースエラーが発生しました: ${err?.message}`);
    }
}
