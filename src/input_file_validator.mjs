// @ts-check

import * as fs from "fs/promises";
import * as msgpack from "@msgpack/msgpack";
import {
    validateAssetsObject,
    validateLegacyLayoutXml,
    validateLegacyYrtFormat,
    validateAlreadyMigrated
} from "./yrt_format_validator.mjs";

/**
 * マイグレーションの準備として、入力されたXMLファイルを検証し、
 * `YrtOldDocument` 型のインスタンスに変換する。
 *
 * - 警告があれば `console.warn("[WARNING] ...")`
 * - エラーがあれば `Error` を reject
 *
 * @param {string} inputFileName - XMLファイルのパス
 * @returns {Promise<import("./yrt_format.js").YrtOldDocument>}
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
        assets: null,
    };
}

/**
 * マイグレーションの準備として、入力された旧形式YRTファイルを検証し、
 * `YrtOldDocument` 型のインスタンスに変換する。
 *
 * - 警告があれば `console.warn("[WARNING] ...")`
 * - エラーがあれば `Error` を reject
 *
 * @param {string} inputFileName - YRTファイルのパス
 * @returns {Promise<import("./yrt_format.js").YrtOldDocument>}
 */
export async function validateYrtInput(inputFileName) {
    const inputFile = await fs.readFile(inputFileName);
    const decoded = msgpack.decode(inputFile);

    const migrationCheckResult = validateAlreadyMigrated(decoded);
    if (migrationCheckResult.type === 'success') {
        console.warn("このYRTファイルはすでにマイグレーション済みです。処理をスキップします。");
        process.exit(0);
    }

    const legacyYrtValidationResult = validateLegacyYrtFormat(decoded);
    if (legacyYrtValidationResult.type === 'warning') {
        console.warn(`[WARNING] 入力されたYRTファイルの検証中に警告が発生しました: ${legacyYrtValidationResult.message}`);
    } else if (legacyYrtValidationResult.type === 'error') {
        throw new Error(`YRTファイル形式が不正です: ${legacyYrtValidationResult.message}`);
    }
    const validatedDecoded = legacyYrtValidationResult.value;

    const assetsObj = validatedDecoded[1];
    if (assetsObj != null) {
        const assetsValidationResult = validateAssetsObject(assetsObj);
        if (assetsValidationResult.type === 'error') {
            console.log(assetsObj);
            throw new Error(`YRTファイル形式が不正です: ${assetsValidationResult.message}`);
        }
    }
    return {
        xml: validatedDecoded[0],
        assets: assetsObj ?? null,
    };
}
