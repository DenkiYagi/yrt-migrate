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
import { migrateFrom2025_1 } from "../src/migration_2025_1/index.js";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const TEST_OUT_DIR = fileURLToPath(new URL("../test-out/integration-2025_1", import.meta.url));

/**
 * @param {string} inputPath
 * @param {boolean} isDirectory
 * @returns {string}
 */
function defaultOutputDirFrom2025_1(inputPath, isDirectory) {
    if (isDirectory) {
        const normalized = inputPath.replace(/[/\\]+$/u, "");
        const { dir, base } = parse(normalized);
        const parentDir = dir === "" ? "." : dir;
        const baseName = base.replace(/-v1\.0$/u, "");
        return join(parentDir, `${baseName}-2026.1`);
    }

    const parsed = parse(inputPath);
    if (parsed.dir === "" || parsed.dir === ".") {
        return join(".", `${parsed.name}-2026.1`);
    }

    const inputDir = parsed.dir;
    const parentDir = dirname(inputDir) === "" ? "." : dirname(inputDir);
    const baseName = basename(inputDir).replace(/-v1\.0$/u, "");
    return join(parentDir, `${baseName}-2026.1`);
}

describe("2025.1 integrationテスト", () => {
    before(async () => {
        await setupTestOutputDir(TEST_OUT_DIR);
    });

    test("ディレクトリ入力で出力先省略時は-2026.1ディレクトリへ出力する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "default-output-dir");
        const inputDir = join(testCaseDir, "input-v1.0");
        await mkdir(inputDir, { recursive: true });
        await writeFile(join(inputDir, "layout-1.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

        const result = await invokeMigration(migrateFrom2025_1, { inputPath: inputDir });

        assert.strictEqual(result.error, null, result.error?.message);
        const outputDir = defaultOutputDirFrom2025_1(inputDir, true);
        assert.strictEqual(await fileExists(outputDir), true);
        const layouts = await readMigratedLayoutXmls(outputDir);
        assert(layouts[0].includes("https://schemas.yagisan.app/2026.1/layout.xsd"));
    });

    test("単一XML入力で出力先省略時は親ディレクトリ基準で出力する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "default-output-file");
        const inputDir = join(testCaseDir, "input-v1.0");
        await mkdir(inputDir, { recursive: true });
        const inputFile = join(inputDir, "layout-1.xml");
        await writeFile(inputFile, '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

        const result = await invokeMigration(migrateFrom2025_1, { inputPath: inputFile });

        assert.strictEqual(result.error, null, result.error?.message);
        const outputDir = defaultOutputDirFrom2025_1(inputFile, false);
        const outputFile = join(outputDir, "layout-1.xml");
        assert.strictEqual(await fileExists(outputFile), true);
        const migratedXml = await readFile(outputFile, "utf8");
        assert(migratedXml.includes("https://schemas.yagisan.app/2026.1/layout.xsd"));
        assert(!migratedXml.includes("https://schemas.yagisan.app/2025.1/layout.xsd"));
    });

    test("カレントディレクトリ直下の単一XML入力ではファイル名ベースの既定出力先を使う", { concurrency: false }, async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "default-output-file-cwd");
        const inputFile = join(testCaseDir, "layout-1.xml");
        await writeFile(inputFile, '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

        const originalCwd = process.cwd();
        try {
            process.chdir(testCaseDir);
            const result = await invokeMigration(migrateFrom2025_1, { inputPath: "layout-1.xml" });

            assert.strictEqual(result.error, null, result.error?.message);
            assert.strictEqual(await fileExists(join(testCaseDir, "layout-1-2026.1", "layout-1.xml")), true);
            assert.strictEqual(await fileExists(join(testCaseDir, ".-2026.1")), false);
        } finally {
            process.chdir(originalCwd);
        }
    });

    test("ディレクトリ入力ではlayoutとstyleを元のファイル名で出力する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "layout-and-style");
        const inputDir = join(testCaseDir, "bundle-v1.0");
        await mkdir(inputDir, { recursive: true });
        await writeFile(join(inputDir, "layout-2.xml"), '<LinearLayout orientation="portrait"><LayoutBody/></LinearLayout>', "utf8");
        await writeFile(join(inputDir, "style.xml"), '<Style><Color key="brand" value="R0G0B0"/></Style>', "utf8");

        const result = await invokeMigration(migrateFrom2025_1, { inputPath: inputDir });

        assert.strictEqual(result.error, null, result.error?.message);
        const outputDir = defaultOutputDirFrom2025_1(inputDir, true);
        const layoutXml = await readFile(join(outputDir, "layout-2.xml"), "utf8");
        const styleXml = await readFile(join(outputDir, "style.xml"), "utf8");
        assert(layoutXml.includes("https://schemas.yagisan.app/2026.1/layout.xsd"));
        assert(styleXml.includes("https://schemas.yagisan.app/2026.1/style.xsd"));
    });

    test("既存の任意名XMLは掃除し、非XMLファイルは保持する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "cleanup-existing-output");
        const inputDir = join(testCaseDir, "bundle-v1.0");
        const outputDir = join(testCaseDir, "converted");
        await mkdir(inputDir, { recursive: true });
        await writeFile(join(inputDir, "cover.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");
        await writeFile(join(inputDir, "style.xml"), "<Style/>", "utf8");

        let result = await invokeMigration(migrateFrom2025_1, { inputPath: inputDir, outputDir });
        assert.strictEqual(result.error, null, result.error?.message);

        await writeFile(join(outputDir, "keep.txt"), "keep me", "utf8");
        await writeFile(join(inputDir, "style.xml"), '<Style><Color key="brand" value="R0G0B0"/></Style>', "utf8");
        await rm(join(inputDir, "cover.xml"), { force: true });

        result = await invokeMigration(migrateFrom2025_1, { inputPath: inputDir, outputDir });
        assert.strictEqual(result.error, null, result.error?.message);
        assert.strictEqual(await fileExists(join(outputDir, "cover.xml")), false);
        assert.strictEqual(await fileExists(join(outputDir, "style.xml")), true);
        assert.strictEqual(await fileExists(join(outputDir, "keep.txt")), true);
    });

    test("--output指定時は指定ディレクトリへ出力する", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "custom-output-dir");
        const inputDir = join(testCaseDir, "custom-v1.0");
        const outputDir = join(testCaseDir, "converted");
        await mkdir(inputDir, { recursive: true });
        await writeFile(join(inputDir, "layout-1.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

        const result = await invokeMigration(migrateFrom2025_1, { inputPath: inputDir, outputDir });

        assert.strictEqual(result.error, null, result.error?.message);
        assert.strictEqual(await fileExists(join(outputDir, "layout-1.xml")), true);
        assert.strictEqual(await fileExists(defaultOutputDirFrom2025_1(inputDir, true)), false);
    });

    test("dry-runでは出力ディレクトリを作成せず、入力ファイルを変更しない", async () => {
        const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "dry-run-file");
        const inputDir = join(testCaseDir, "dry-run-v1.0");
        await mkdir(inputDir, { recursive: true });
        const inputFile = join(inputDir, "layout-1.xml");
        const inputXml = '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>';
        await writeFile(inputFile, inputXml, "utf8");

        const result = await invokeMigration(migrateFrom2025_1, {
            inputPath: inputFile,
            dryRun: true,
        });

        assert.strictEqual(result.error, null, result.error?.message);
        assert.strictEqual(await fileExists(defaultOutputDirFrom2025_1(inputFile, false)), false);
        assert.strictEqual(await readFile(inputFile, "utf8"), inputXml);
    });

    describe("異常ケース", () => {
        test("存在しない入力パスは例外を投げる", async () => {
            const result = await invokeMigration(migrateFrom2025_1, {
                inputPath: "missing-v1.0/layout-1.xml",
            });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("入力パスが見つかりません"));
        });

        test("空ディレクトリは例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "empty-directory");
            const inputDir = join(testCaseDir, "empty-v1.0");
            await mkdir(inputDir, { recursive: true });

            const result = await invokeMigration(migrateFrom2025_1, { inputPath: inputDir });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("入力ディレクトリにXMLファイルが見つかりません"));
        });

        test("非XMLファイルは例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "invalid-extension");
            const inputFile = join(testCaseDir, "layout.txt");
            await writeFile(inputFile, "plain text", "utf8");

            const result = await invokeMigration(migrateFrom2025_1, { inputPath: inputFile });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("非対応のファイル形式です"));
        });

        test("未対応のルート要素を含むXMLは例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "unsupported-root");
            const inputFile = join(testCaseDir, "layout.xml");
            await writeFile(inputFile, "<LayoutXml><LinearLayout/></LayoutXml>", "utf8");

            const result = await invokeMigration(migrateFrom2025_1, { inputPath: inputFile });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("入力ファイルの読み込みに失敗しました"));
        });

        test("不正なXMLは例外を投げる", async () => {
            const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "invalid-xml");
            const inputFile = join(testCaseDir, "layout.xml");
            await writeFile(inputFile, "Invalid text", "utf8");

            const result = await invokeMigration(migrateFrom2025_1, { inputPath: inputFile });

            assert(result.error instanceof Error);
            assert(result.error.message.includes("入力ファイルの読み込みに失敗しました"));
        });
    });
});
