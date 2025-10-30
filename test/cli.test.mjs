// @ts-check

import { test, describe, before } from "node:test";
import assert from "node:assert";
import {
    runYrtMigrate,
    fileExists,
    createTestCaseDir,
    setupTestOutputDir,
    readMigratedLayoutXmls,
    readMigratedStyleXml,
    prepareInputFile
} from "./test-utils.mjs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, parse } from "node:path";

/**
 * @param {string} filePath 
 * @returns {string} - デフォルトの出力ディレクトリパス
 */
function defaultOutputDirFor(filePath) {
    const parsed = parse(filePath);
    const parentDir = parsed.dir === "" ? "." : parsed.dir;
    return join(parentDir, `${parsed.name}-v1.0`);
}

describe("yrt-migrate CLIテスト", () => {
    const testOutDir = "test-out/cli";

    before(async () => {
        await setupTestOutputDir(testOutDir);
    });

    describe("引数なし / ヘルプ", () => {
        test("引数なしで実行すると、エラー終了する", async () => {
            const result = await runYrtMigrate([]);
            assert.strictEqual(result.exitCode, 1);
        });

        test("--helpオプションで成功する", async () => {
            const result = await runYrtMigrate(["--help"]);
            assert.strictEqual(result.exitCode, 0);
        });

        test("-hオプションで成功する", async () => {
            const result = await runYrtMigrate(["-h"]);
            assert.strictEqual(result.exitCode, 0);
        });
    });

    describe("--diagnostics オプション", () => {
        test("警告をファイルに書き出す", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "diagnostics-output");
            const inputFile = join(testCaseDir, "warning.xml");
            const diagnosticsFile = join(testCaseDir, "warnings.log");
            const xmlSource = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<LayoutXml>',
                '  <Grid foreach="${items}" hidden="flag">',
                '    <GridCell col="0" row="0"/>',
                '  </Grid>',
                '</LayoutXml>'
            ].join("\n");
            await writeFile(inputFile, xmlSource, "utf8");

            const result = await runYrtMigrate([
                "--input", inputFile,
                "--dry-run",
                "--diagnostics", diagnosticsFile
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(diagnosticsFile), true, "指定した警告ファイルが作成されませんでした。");
            const diagnosticsContent = await readFile(diagnosticsFile, "utf8");
            assert(diagnosticsContent.includes("[WARNING]"), "警告ファイルに警告プレフィックスが含まれていません。");
            assert(diagnosticsContent.includes("foreach属性とhidden属性が同時に指定されている"), "期待する警告メッセージがファイルに記録されませんでした。");
        });
    });

    test("位置引数でXMLファイルを指定すると、同じディレクトリに出力ディレクトリが作成される", async () => {
        const testCaseDir = await createTestCaseDir(testOutDir, "xml-positional-only");
        const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
        const result = await runYrtMigrate([inputFile]);

        assert.strictEqual(result.exitCode, 0);

        const expectedOutputDir = defaultOutputDirFor(inputFile);
        assert.strictEqual(await fileExists(expectedOutputDir), true, "出力ディレクトリが作成されること");

        const layouts = await readMigratedLayoutXmls(expectedOutputDir);
        assert.strictEqual(layouts.length, 1, "レイアウトXMLが1つ生成されること");
        assert(layouts[0].includes("<StackLayout"), "変換後のLayoutXMLが生成されること");
        assert(!layouts[0].includes("<LayoutXml>"), "<LayoutXml>要素は出力されないこと");

        const style = await readMigratedStyleXml(expectedOutputDir);
        assert(style === null || style.includes("<Style"), "StyleXMLが存在しないか正しい形式であること");
    });

    test("位置引数でXMLファイルと--outputを指定すると、指定したディレクトリに出力される", async () => {
        const testCaseDir = await createTestCaseDir(testOutDir, "xml-positional-with-output");
        const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
        const outputDir = join(testCaseDir, "custom-output");

        const result = await runYrtMigrate([
            inputFile,
            "--output", outputDir
        ]);

        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(await fileExists(outputDir), true, "指定したディレクトリが作成されること");

        const layouts = await readMigratedLayoutXmls(outputDir);
        assert.strictEqual(layouts.length, 1);
    });

    test("-i と -o オプションでXMLファイルを指定すると、指定先に出力される", async () => {
        const testCaseDir = await createTestCaseDir(testOutDir, "xml-input-output-options");
        const inputFile = await prepareInputFile("test/fixtures/legacy_complex.xml", testCaseDir);
        const outputDir = join(testCaseDir, "converted");

        const result = await runYrtMigrate([
            "--input", inputFile,
            "--output", outputDir
        ]);

        assert.strictEqual(result.exitCode, 0);
        assert.strictEqual(await fileExists(outputDir), true, "指定した出力ディレクトリが作成されること");

        const layouts = await readMigratedLayoutXmls(outputDir);
        assert(layouts.length > 0, "レイアウトXMLが生成されること");
    });

    test("--dry-runオプションでXMLファイルを指定すると、ファイル出力せずに標準出力に変換結果が表示される", async () => {
        // Temporarily skip this block When run by Codex, because of Codex sandbox stdout/stderr logging limitations

        const testCaseDir = await createTestCaseDir(testOutDir, "xml-dry-run");
        const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
        const inputDataBeforeRun = await readFile(inputFile);
        const result = await runYrtMigrate([
            "--dry-run",
            inputFile
        ]);

        assert.strictEqual(result.exitCode, 0);
        assert(result.stdout.includes("=== Layout 0 ==="), "Layout情報がヘッダーと共に出力されること");
        assert(result.stdout.includes("<StackLayout"), "変換後のLayoutXMLが出力されること");
        assert(!result.stdout.includes("<LayoutXml>"), "<LayoutXml>要素は出力されないこと");

        const inputDataAfterRun = await readFile(inputFile);
        assert.deepStrictEqual(inputDataAfterRun, inputDataBeforeRun, "--dry-runでは入力ファイルが変更されないこと");

        const files = await readdir(testCaseDir);
        assert.deepStrictEqual(files, [basename(inputFile)], "--dry-runでは新たなファイルが出力されないこと");
    });

    describe("異常ケース（要 stderr）", () => {
        // Temporarily skip this block When run by Codex, because of Codex sandbox stdout/stderr logging limitations

        test("入力として存在しないファイルを指定すると、生のENOENTエラーが出力される", async () => {
            const result = await runYrtMigrate(["nonexistent.xml"]);
            assert.strictEqual(result.exitCode, 1);
            assert(result.stderr.includes("ENOENT"));
        });

        test("入力として無効な拡張子のファイルを指定すると、非対応の形式である旨のエラーメッセージが出力される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "invalid-file");
            const invalidFile = await prepareInputFile("test/fixtures/invalid_extension.txt", testCaseDir);

            const result = await runYrtMigrate([invalidFile]);
            assert.strictEqual(result.exitCode, 1);
            assert(result.stderr.includes("非対応のファイル形式です"));
        });

        test("旧形式でない（ルート要素が LayoutXml ではない）XMLファイルが入力されたとき、エラーメッセージが出力される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "invalid-xml-root");
            const invalidXmlFile = await prepareInputFile("test/fixtures/invalid_xml_root.xml", testCaseDir);
            const result = await runYrtMigrate([invalidXmlFile]);
            assert.strictEqual(result.exitCode, 1);
            assert(result.stderr.includes("XMLファイル形式が不正です"), "不正なXML形式のエラーメッセージが出力されること");
        });

        test("YRTファイルは非対応の形式として扱われる", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "reject-yrt");
            const yrtFile = await prepareInputFile("test/fixtures/legacy_complex.yrt", testCaseDir);
            const result = await runYrtMigrate([yrtFile]);
            assert.strictEqual(result.exitCode, 1);
            assert(result.stderr.includes("非対応のファイル形式です"), "YRT入力は非対応であること");
        });
    });
});
