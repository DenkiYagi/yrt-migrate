// @ts-check

import { test, describe, before } from "node:test";
import assert from "node:assert";
import {
    invokeMigration,
    fileExists,
    createTestCaseDir,
    setupTestOutputDir,
    readMigratedLayoutXmls,
} from "./test-utils.mjs";
import { migrateFrom2026_1 } from "../src/migration_2026_1/index.js";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const TEST_OUT_DIR = fileURLToPath(new URL("../test-out/integration-2026_1", import.meta.url));

/**
 * @param {string} inputPath
 * @param {boolean} isDirectory
 * @returns {string}
 */
function defaultOutputDirFrom2026_1(inputPath, isDirectory) {
    if (isDirectory) {
        const normalized = inputPath.replace(/[/\\]+$/u, "");
        const { dir, base } = parse(normalized);
        const parentDir = dir === "" ? "." : dir;
        const baseName = base.replace(/-(?:v1\.0|2025\.1|2026\.1)$/u, "");
        return join(parentDir, `${baseName}-2026.2`);
    }

    const parsed = parse(inputPath);
    if (parsed.dir === "" || parsed.dir === ".") {
        return join(".", `${parsed.name}-2026.2`);
    }

    const inputDir = parsed.dir;
    const parentDir = dirname(inputDir) === "" ? "." : dirname(inputDir);
    const baseName = basename(inputDir).replace(/-(?:v1\.0|2025\.1|2026\.1)$/u, "");
    return join(parentDir, `${baseName}-2026.2`);
}

describe("`--from 2026.1` 統合テスト", () => {
    before(async () => {
        await setupTestOutputDir(TEST_OUT_DIR);
    });

    test("2026.1のlayoutとstyleを2026.2へ変換できる", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "layout-and-style");
        const inputDir = join(testCaseDir, "bundle-2026.1");
        const outputDir = join(testCaseDir, "bundle-2026.2");
        await mkdir(inputDir, { recursive: true });
        await writeFile(
            join(inputDir, "layout-1.xml"),
            '<StackLayout xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2026.1/layout.xsd" orientation="portrait"><LayoutBody/></StackLayout>',
            "utf8"
        );
        await writeFile(
            join(inputDir, "style.xml"),
            '<Style xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="https://schemas.yagisan.app/2026.1/style.xsd"><Color key="brand" value="R0G0B0"/></Style>',
            "utf8"
        );

        const result = await invokeMigration(migrateFrom2026_1, { inputPath: inputDir, outputDir });
        assert.strictEqual(result.error, null, result.error?.message);

        const layoutXml = await readFile(join(outputDir, "layout-1.xml"), "utf8");
        const styleXml = await readFile(join(outputDir, "style.xml"), "utf8");
        assert(layoutXml.includes("https://schemas.yagisan.app/2026.2/layout.xsd"));
        assert(!layoutXml.includes("https://schemas.yagisan.app/2026.1/layout.xsd"));
        assert(styleXml.includes("https://schemas.yagisan.app/2026.2/style.xsd"));
        assert(!styleXml.includes("https://schemas.yagisan.app/2026.1/style.xsd"));
    });

    test("ディレクトリ入力で出力先省略時は `-2026.2` ディレクトリへ出力する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "default-output-dir");
        const inputDir = join(testCaseDir, "input-2026.1");
        await mkdir(inputDir, { recursive: true });
        await writeFile(join(inputDir, "layout-1.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

        const result = await invokeMigration(migrateFrom2026_1, { inputPath: inputDir });

        assert.strictEqual(result.error, null, result.error?.message);
        const outputDir = defaultOutputDirFrom2026_1(inputDir, true);
        assert.strictEqual(await fileExists(join(outputDir, "layout-1.xml")), true);
        assert.strictEqual(await fileExists(join(testCaseDir, "input-2026.1-2026.2")), false);
        const layouts = await readMigratedLayoutXmls(outputDir);
        assert(layouts[0].includes("https://schemas.yagisan.app/2026.2/layout.xsd"));
    });

    test("単一XML入力で出力先省略時は親ディレクトリ基準で出力する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "default-output-file");
        const inputDir = join(testCaseDir, "input-2026.1");
        await mkdir(inputDir, { recursive: true });
        const inputFile = join(inputDir, "layout-1.xml");
        await writeFile(inputFile, '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

        const result = await invokeMigration(migrateFrom2026_1, { inputPath: inputFile });

        assert.strictEqual(result.error, null, result.error?.message);
        const outputDir = defaultOutputDirFrom2026_1(inputFile, false);
        const outputFile = join(outputDir, "layout-1.xml");
        assert.strictEqual(await fileExists(outputFile), true);
        const migratedXml = await readFile(outputFile, "utf8");
        assert(migratedXml.includes("https://schemas.yagisan.app/2026.2/layout.xsd"));
    });

    test("既存の任意名XMLは掃除し、非XMLファイルは保持する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "cleanup-existing-output");
        const inputDir = join(testCaseDir, "bundle-2026.1");
        const outputDir = join(testCaseDir, "converted");
        await mkdir(inputDir, { recursive: true });
        await writeFile(join(inputDir, "cover.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");
        await writeFile(join(inputDir, "style.xml"), "<Style/>", "utf8");

        let result = await invokeMigration(migrateFrom2026_1, { inputPath: inputDir, outputDir });
        assert.strictEqual(result.error, null, result.error?.message);

        await writeFile(join(outputDir, "keep.txt"), "keep me", "utf8");
        await writeFile(join(inputDir, "style.xml"), '<Style><Color key="brand" value="R0G0B0"/></Style>', "utf8");
        await rm(join(inputDir, "cover.xml"), { force: true });

        result = await invokeMigration(migrateFrom2026_1, { inputPath: inputDir, outputDir });
        assert.strictEqual(result.error, null, result.error?.message);
        assert.strictEqual(await fileExists(join(outputDir, "cover.xml")), false);
        assert.strictEqual(await fileExists(join(outputDir, "style.xml")), true);
        assert.strictEqual(await fileExists(join(outputDir, "keep.txt")), true);
    });

    test("dry-runでは出力ディレクトリを作成せず、入力ファイルを変更しない", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "dry-run-file");
        const inputDir = join(testCaseDir, "dry-run-2026.1");
        await mkdir(inputDir, { recursive: true });
        const inputFile = join(inputDir, "layout-1.xml");
        const inputXml = '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>';
        await writeFile(inputFile, inputXml, "utf8");

        const result = await invokeMigration(migrateFrom2026_1, {
            inputPath: inputFile,
            dryRun: true,
        });

        assert.strictEqual(result.error, null, result.error?.message);
        assert.strictEqual(await fileExists(defaultOutputDirFrom2026_1(inputFile, false)), false);
        assert.strictEqual(await readFile(inputFile, "utf8"), inputXml);
    });

    describe("異常ケース", () => {
        test("存在しない入力パスは例外を投げる", async () => {
            const result = await invokeMigration(migrateFrom2026_1, {
                inputPath: "missing-2026.1/layout-1.xml",
            });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("入力パスが見つかりません"));
        });

        test("空ディレクトリは例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "empty-directory");
            const inputDir = join(testCaseDir, "empty-2026.1");
            await mkdir(inputDir, { recursive: true });

            const result = await invokeMigration(migrateFrom2026_1, { inputPath: inputDir });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("入力ディレクトリにXMLファイルが見つかりません"));
        });

        test("非XMLファイルは例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "invalid-extension");
            const inputFile = join(testCaseDir, "layout.txt");
            await writeFile(inputFile, "plain text", "utf8");

            const result = await invokeMigration(migrateFrom2026_1, { inputPath: inputFile });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("非対応のファイル形式です"));
        });

        test("未対応のルート要素を含むXMLは例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "unsupported-root");
            const inputFile = join(testCaseDir, "layout.xml");
            await writeFile(inputFile, "<LayoutXml><LinearLayout/></LayoutXml>", "utf8");

            const result = await invokeMigration(migrateFrom2026_1, { inputPath: inputFile });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("入力ファイルの読み込みに失敗しました"));
        });
    });
});
