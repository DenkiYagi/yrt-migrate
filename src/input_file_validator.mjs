// @ts-check

import * as fs from "fs/promises";
import {
    validateLegacyLayoutXml
} from "./yrt_format_validator.mjs";

/**
 * マイグレーションの準備として、入力されたXMLファイルを検証し、
 * `LegacyLayoutDocument` 型のインスタンスに変換する。
 *
 * - 警告があれば `console.warn("[WARNING] ...")`
 * - エラーがあれば `Error` を reject
 *
 * @param {string} inputFileName XMLファイルのパス
 * @returns {Promise<import("./yrt_format.js").LegacyLayoutDocument>}
 */
export async function validateXmlInput(inputFileName) {
    const inputLayoutXml = await fs.readFile(inputFileName, "utf-8");
    const xmlValidation = validateLegacyLayoutXml(inputLayoutXml);
    if (xmlValidation.type === 'warning') {
        console.warn(`[WARNING] 入力されたXMLファイルの検証中に警告が発生しました: ${xmlValidation.message}`);
    } else if (xmlValidation.type === 'error') {
        throw new Error(`XMLファイル形式が不正です: ${xmlValidation.message}`);
    }
    return {
        xml: xmlValidation.value,
    };
}
