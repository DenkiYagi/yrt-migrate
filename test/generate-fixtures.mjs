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

async function main() {
    const fixturesDir = path.resolve("test/fixtures");

    console.log("テスト用YRTファイルを生成中...");
    await generateYrtFiles();
    console.log("✅ テスト用YRTファイルの生成が完了しました");
    console.log(`📁 場所: ${fixturesDir}`);
}

main().catch(console.error);
