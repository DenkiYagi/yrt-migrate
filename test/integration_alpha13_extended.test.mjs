// @ts-check

import { test, describe, before } from "node:test";
import assert from "node:assert";
import {
    invokeMigration,
    fileExists,
    createTestCaseDir,
    setupTestOutputDir,
    readMigratedLayoutXmls,
    readMigratedStyleXml,
    prepareInputFile
} from "./test-utils.mjs";
import { migrateFromAlpha13 } from "../src/migration_alpha13/index.js";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const TEST_OUT_DIR = fileURLToPath(new URL("../test-out/integration-alpha13", import.meta.url));
const FIXTURES_DIR = fileURLToPath(new URL("./fixtures", import.meta.url));

/**
 * @param  {...string} segments
 * @returns {string}
 */
const fixturePath = (...segments) => join(FIXTURES_DIR, ...segments);

/**
 * @param {string} inputFilePath
 * @returns {string}
 */
function defaultOutputDirFor(inputFilePath) {
    const parsed = parse(inputFilePath);
    const parentDir = parsed.dir === "" ? "." : parsed.dir;
    return join(parentDir, `${parsed.name}-v1.0`);
}

describe("alpha13 integration追加テスト", () => {
    before(async () => {
        await setupTestOutputDir(TEST_OUT_DIR);
    });

    test("出力先省略時は既定ディレクトリへ出力し、最小fixtureからlayoutのみを生成する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "minimal-default-output");
        const inputFile = await prepareInputFile(fixturePath("legacy_minimal.xml"), testCaseDir);

        const result = await invokeMigration(migrateFromAlpha13, { inputPath: inputFile });

        assert.strictEqual(result.error, null, result.error?.message);
        const outputDir = defaultOutputDirFor(inputFile);
        assert.strictEqual(await fileExists(outputDir), true);

        const layouts = await readMigratedLayoutXmls(outputDir);
        assert.strictEqual(layouts.length, 1);
        assert(layouts[0].includes("<StackLayout"));
        assert(!layouts[0].includes("<LayoutXml>"));

        const style = await readMigratedStyleXml(outputDir);
        assert.strictEqual(style, null);
    });

    test("diagnosticsオプションで警告ファイルを書き出す", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "diagnostics-output");
        const inputFile = join(testCaseDir, "warning.xml");
        const diagnosticsFile = join(testCaseDir, "warnings.log");
        const xmlSource = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            "<LayoutXml>",
            '  <Grid foreach="${items}" hidden="flag">',
            '    <GridCell col="0" row="0"/>',
            "  </Grid>",
            "</LayoutXml>"
        ].join("\n");
        await writeFile(inputFile, xmlSource, "utf8");

        const result = await invokeMigration(migrateFromAlpha13, {
            inputPath: inputFile,
            diagnostics: diagnosticsFile,
            dryRun: true,
        });

        assert.strictEqual(result.error, null, result.error?.message);
        assert.strictEqual(await fileExists(diagnosticsFile), true);
        const diagnosticsContent = await readFile(diagnosticsFile, "utf8");
        assert(diagnosticsContent.includes("[WARNING]"));
        assert(diagnosticsContent.includes("foreach属性とhidden属性が同時に指定されている"));
    });

    test("dry-runでは入力を変更せず、出力ディレクトリを作らない", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "dry-run");
        const inputFile = await prepareInputFile(fixturePath("legacy_minimal.xml"), testCaseDir);
        const inputDataBeforeRun = await readFile(inputFile, "utf8");

        const result = await invokeMigration(migrateFromAlpha13, {
            inputPath: inputFile,
            dryRun: true,
        });

        assert.strictEqual(result.error, null, result.error?.message);
        assert.strictEqual(await readFile(inputFile, "utf8"), inputDataBeforeRun);
        assert.strictEqual(await fileExists(defaultOutputDirFor(inputFile)), false);
        const files = await readdir(testCaseDir);
        assert.deepStrictEqual(files.sort(), [parse(inputFile).base]);
    });

    test("既存のlayout/styleは掃除し、対象外ファイルは保持する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "cleanup");
        const inputFile = await prepareInputFile(fixturePath("legacy_minimal.xml"), testCaseDir);
        const outputDir = join(testCaseDir, "out");
        await mkdir(outputDir, { recursive: true });
        await writeFile(join(outputDir, "layout-99.xml"), "<LinearLayout id=\"stale\"/>", "utf8");
        await writeFile(join(outputDir, "style.xml"), "<Style id=\"stale\"/>", "utf8");
        await writeFile(join(outputDir, "keep.txt"), "keep me", "utf8");

        const result = await invokeMigration(migrateFromAlpha13, {
            inputPath: inputFile,
            outputDir,
        });

        assert.strictEqual(result.error, null, result.error?.message);
        const entries = await readdir(outputDir);
        assert(entries.includes("keep.txt"));
        assert(!entries.includes("layout-99.xml"));
        assert(!entries.includes("style.xml"));
    });

    describe("異常ケース", () => {
        test("無効な拡張子は例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "invalid-extension");
            const inputFile = join(testCaseDir, "layout.txt");
            await writeFile(inputFile, "plain text", "utf8");

            const result = await invokeMigration(migrateFromAlpha13, { inputPath: inputFile });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("非対応のファイル形式です"));
        });

        test("旧形式でないXMLは例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "invalid-root");
            const inputFile = await prepareInputFile(fixturePath("invalid_xml_root.xml"), testCaseDir);

            const result = await invokeMigration(migrateFromAlpha13, { inputPath: inputFile });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("入力ファイルの検証に失敗しました"));
        });

        test("YRTファイルは例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "reject-yrt");
            const inputFile = await prepareInputFile(fixturePath("legacy_complex.yrt"), testCaseDir);

            const result = await invokeMigration(migrateFromAlpha13, { inputPath: inputFile });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("非対応のファイル形式です"));
        });
    });
});
