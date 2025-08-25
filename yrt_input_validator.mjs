// @ts-check

import * as fs from "fs/promises";
import * as msgpack from "@msgpack/msgpack";
import { packageToYrtRoot } from "./yrt_format.js";
import { validateAssetsObject, validateLegacyLayoutXml, validateLegacyYrtFormat, validateAlreadyMigrated } from "./yrt_format_legacy.mjs";

/**
 * マイグレーションの準備として、XMLファイルを検証し、データ型だけ新形式YRTに変換する。
 * XMLは旧形式の状態であることに注意
 * @param {string} inputFileName - XMLファイルのパス
 * @returns {Promise<import("./types.js").DecodedYrt>}
 */
export async function validateXmlInput(inputFileName) {
    const inputLayoutXml = await fs.readFile(inputFileName, "utf-8");
    const xmlValidation = validateLegacyLayoutXml(inputLayoutXml);
    if (xmlValidation.type === 'warning') {
        console.warn(xmlValidation.message);
    } else if (xmlValidation.type === 'error') {
        throw new Error(`XMLファイル形式が不正です: ${xmlValidation.message}`);
    }
    const initialYrtPackage = {
        layouts: [{ name: null, xml: xmlValidation.value }],
        style: null,
        assets: null,
    };

    // @ts-ignore YrtRoot型が正しく推論されないため無視
    return packageToYrtRoot(initialYrtPackage);
}

/**
 * マイグレーションの準備として、YRTファイルを検証し、データ型だけ新形式YRTに変換する。
 * XMLは旧形式の状態であることに注意
 * @param {string} inputFileName - YRTファイルのパス
 * @returns {Promise<import("./types.js").DecodedYrt>}
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
        console.warn(legacyYrtValidationResult.message);
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
    const yrtPackage = {
        layouts: [{ name: null, xml: validatedDecoded[0] }],
        style: null,
        assets: assetsObj ?? null,
    };

    // @ts-ignore YrtRoot型が正しく推論されないため無視
    return packageToYrtRoot(yrtPackage);
}
