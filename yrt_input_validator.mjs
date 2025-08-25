// @ts-check

import * as fs from "fs/promises";
import * as msgpack from "@msgpack/msgpack";
import { packageToYrtRoot } from "./yrt_format.js";
import { isAssetsObject, isLegacyLayoutXml, isLegacyYrtFormat, isAlreadyMigrated } from "./yrt_format_legacy.mjs";

/**
 * マイグレーションの準備として、XMLファイルを検証し、データ型だけ新形式YRTに変換する。
 * XMLは旧形式の状態であることに注意
 * @param {string} inputFileName - XMLファイルのパス
 * @returns {Promise<import("./types.js").DecodedYrt>}
 */
export async function validateXmlInput(inputFileName) {
    const inputLayoutXml = await fs.readFile(inputFileName, "utf-8");
    if (!isLegacyLayoutXml(inputLayoutXml)) {
        throw new Error("XMLファイル形式が不正です: alpha系旧XML形式ではありません");
    }
    const initialYrtPackage = {
        layouts: [{ name: null, xml: inputLayoutXml }],
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
    if (isAlreadyMigrated(decoded)) {
        console.warn("このYRTファイルはすでにマイグレーション済みです。処理をスキップします。");
        process.exit(0);
    }
    if (!isLegacyYrtFormat(decoded)) {
        throw new Error("YRTファイル形式が不正です: alpha系旧YRT形式ではありません");
    }
    const assetsObj = decoded[1];
    if (assetsObj != null && !isAssetsObject(assetsObj)) {
        console.log(assetsObj);
        throw new Error("YRTファイル形式が不正です: アセットが Record<string, Uint8Array> ではありません");
    }
    const yrtPackage = {
        layouts: [{ name: null, xml: decoded[0] }],
        style: null,
        assets: assetsObj ?? null,
    };

    // @ts-ignore YrtRoot型が正しく推論されないため無視
    return packageToYrtRoot(yrtPackage);
}
