#!/usr/bin/env node

/**
 * テスト用YRTフィクスチャファイルを生成するスタンドアロンスクリプト
 * 使用方法: node test/generate-fixtures.mjs
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as msgpack from "@msgpack/msgpack";

/**
 * テスト用のYRTファイルを生成する
 *
 * レガシーYRT形式: [xml] | [xml, assets]
 */
async function generateYrtFiles() {
    const fixturesDir = path.resolve("test/fixtures");

    // シンプルなレガシーYRTファイル（アセットなし）
    const minimalXmlPath = path.join(fixturesDir, "legacy_minimal.xml");
    const minimalLayoutXml = await fs.readFile(minimalXmlPath, "utf-8");
    const simpleYrtData = [minimalLayoutXml];
    const simpleEncoded = msgpack.encode(simpleYrtData);
    await fs.writeFile(path.join(fixturesDir, "legacy_minimal.yrt"), Buffer.from(simpleEncoded));

    // 複雑なレガシーYRTファイル（画像アセット付き）
    const complexXmlPath = path.join(fixturesDir, "legacy_complex.xml");
    const complexLayoutXml = await fs.readFile(complexXmlPath, "utf-8");
    const imagePath = path.join(fixturesDir, "image.png");
    const imageData = await fs.readFile(imagePath);
    const assets = { image: new Uint8Array(imageData) };
    const complexYrtData = [complexLayoutXml, assets];
    const complexEncoded = msgpack.encode(complexYrtData);
    await fs.writeFile(path.join(fixturesDir, "legacy_complex.yrt"), Buffer.from(complexEncoded));
}

/**
 * テスト用の無効なYRTファイルを生成する
 */
async function generateInvalidYrtFiles() {
    const fixturesDir = path.resolve("test/fixtures");

    // 無効なYRTファイル（空のオブジェクト）
    const invalidYrtObject = msgpack.encode({});
    await fs.writeFile(path.join(fixturesDir, "invalid_yrt_object.yrt"), Buffer.from(invalidYrtObject));

    // 無効なYRTファイル（配列だがXMLが旧形式でない）
    const invalidXmlPath = path.join(fixturesDir, "invalid_xml_root.xml");
    const invalidXml = await fs.readFile(invalidXmlPath, "utf-8");
    const invalidYrtArray = msgpack.encode([invalidXml]);
    await fs.writeFile(path.join(fixturesDir, "invalid_yrt_xml_root.yrt"), Buffer.from(invalidYrtArray));
}

async function main() {
    const fixturesDir = path.resolve("test/fixtures");

    console.log("正常系テスト用YRTファイルを生成中...");
    await generateYrtFiles();
    console.log("✅ 正常系テスト用YRTファイルの生成が完了しました");
    
    console.log("異常系テスト用YRTファイルを生成中...");
    await generateInvalidYrtFiles();
    console.log("✅ 異常系テスト用YRTファイルの生成が完了しました");
    
    console.log(`📁 場所: ${fixturesDir}`);
}

main().catch(console.error);
