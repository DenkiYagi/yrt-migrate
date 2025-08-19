import { test, describe, before } from "node:test";
import assert from "node:assert";
import * as fs from "fs/promises";
import * as path from "path";
import {
    runYrtMigrate,
    fileExists,
    createTestCaseDir,
    setupTestOutputDir,
    readAndValidateNewFormatYrtFile
} from "./test-utils.mjs";

describe("yrt-migrate CLI統合テスト", () => {
    const testOutDir = path.resolve("test-out");

    before(async () => {
        await setupTestOutputDir(testOutDir);
        // Note: YRT fixture files should be generated manually using:
        // node test/generate-fixtures.mjs
    });

    describe("ヘルプとエラーハンドリング", () => {
        test("引数なしで実行するとエラーメッセージを表示", async () => {
            const result = await runYrtMigrate([]);
            assert.strictEqual(result.exitCode, 1);
            assert(result.stderr.includes("入力ファイルを指定してください"));
        });

        test("--helpオプションでヘルプメッセージを表示", async () => {
            const result = await runYrtMigrate(["--help"]);
            assert.strictEqual(result.exitCode, 0);
            assert(result.stdout.includes("Usage: npx yrt-migrate"));
            assert(result.stdout.includes("--input"));
            assert(result.stdout.includes("--output"));
        });

        test("-hオプションでヘルプメッセージを表示", async () => {
            const result = await runYrtMigrate(["-h"]);
            assert.strictEqual(result.exitCode, 0);
            assert(result.stdout.includes("Usage: npx yrt-migrate"));
        });
    });

    describe("XMLファイル入力のテスト", () => {
        test("XMLファイルからYRTファイルへの変換", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "01-xml-to-yrt");

            const inputFile = path.resolve("test/fixtures/legacy_complex.xml");
            const outputFile = path.join(testCaseDir, "output.yrt");

            const result = await runYrtMigrate([
                "--input", inputFile,
                "--output", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            // 出力ファイルの存在確認
            assert.strictEqual(await fileExists(outputFile), true);

            // 出力内容の検証
            const yrtRoot = await readAndValidateNewFormatYrtFile(outputFile);
            const body = yrtRoot[2];

            assert.strictEqual(body.l.length, 2);
            assert.strictEqual(body.l[0][0], null); // layout name
            assert(body.l[0][1].includes("<StackLayout"));
            assert(!body.l[0][1].includes("<LayoutXml>"));
            assert.strictEqual(body.l[1][0], null); // second layout name
            assert(body.l[1][1].includes("<LinearLayout"));
            assert(!body.l[1][1].includes("<LayoutXml>"));
        });

        test("XMLファイルをdry-runモードで実行", async () => {
            const inputFile = path.resolve("test/fixtures/legacy_minimal.xml");

            const result = await runYrtMigrate([
                "--input", inputFile,
                "--dry-run"
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert(result.stdout.includes("=== Layout 0 ==="));
            assert(result.stdout.includes("<StackLayout"));
            assert(!result.stdout.includes("<LayoutXml>"));
        });

        test("XMLファイルの位置引数での指定", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "02-xml-positional");

            const inputFile = path.resolve("test/fixtures/legacy_minimal.xml");
            const outputFile = path.join(testCaseDir, "simple_layout.yrt");

            const result = await runYrtMigrate([
                inputFile,
                "--output", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(outputFile), true);
        });
    });

    describe("YRTファイル入力のテスト", () => {
        test("レガシーYRTファイルから新形式への変換", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "03-yrt-migration");

            // 入力ファイルをテスト用ディレクトリにコピー
            const originalFile = path.resolve("test/fixtures/legacy_complex.yrt");
            const inputFile = path.join(testCaseDir, "input.yrt");
            await fs.copyFile(originalFile, inputFile);

            const outputFile = path.join(testCaseDir, "output.yrt");
            const backupFile = path.join(testCaseDir, "backup.yrt");

            const result = await runYrtMigrate([
                "--input", inputFile,
                "--output", outputFile,
                "--backup", backupFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            // 出力ファイルの存在確認
            assert.strictEqual(await fileExists(outputFile), true);

            // 出力内容の検証
            const yrtRoot = await readAndValidateNewFormatYrtFile(outputFile);
            const body = yrtRoot[2];

            assert.strictEqual(body.l.length, 2);
            assert(body.l[0][1].includes("<StackLayout"));
            assert(!body.l[0][1].includes("<LayoutXml>"));
            assert(body.l[1][1].includes("<LinearLayout"));
            assert(!body.l[1][1].includes("<LayoutXml>"));
            assert(body.a); // assets should exist
            assert(body.a["image"]); // image asset should exist
        });

        test("YRTファイルのインプレース変換（バックアップ作成）", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "04-yrt-inplace");

            // 入力ファイルをテスト用ディレクトリにコピー
            const originalFile = path.resolve("test/fixtures/legacy_complex.yrt");
            const inputFile = path.join(testCaseDir, "data.yrt");
            await fs.copyFile(originalFile, inputFile);

            const result = await runYrtMigrate([inputFile]);

            assert.strictEqual(result.exitCode, 0);

            // 元ファイルが変換されていることを確認
            await readAndValidateNewFormatYrtFile(inputFile);

            // バックアップファイルの存在確認
            const backupFile = path.join(testCaseDir, "data.yrt.old");
            assert.strictEqual(await fileExists(backupFile), true);
        });

        test("YRTファイルをdry-runモードで実行", async () => {
            const inputFile = path.resolve("test/fixtures/legacy_complex.yrt");

            const result = await runYrtMigrate([
                "--input", inputFile,
                "--dry-run"
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert(result.stdout.includes("=== Layout 0 ==="));
            assert(result.stdout.includes("<LinearLayout"));
            assert(!result.stdout.includes("<LayoutXml>"));
        });
    });

    describe("オプションの組み合わせテスト", () => {
        test("すべてのオプションを指定した変換", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "05-all-options");

            const originalFile = path.resolve("test/fixtures/legacy_complex.yrt");
            const inputFile = path.join(testCaseDir, "input.yrt");
            await fs.copyFile(originalFile, inputFile);

            const outputFile = path.join(testCaseDir, "converted.yrt");
            const backupFile = path.join(testCaseDir, "input.backup");

            const result = await runYrtMigrate([
                "-i", inputFile,
                "-o", outputFile,
                "-b", backupFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            // すべてのファイルの存在確認
            assert.strictEqual(await fileExists(outputFile), true);

            // 出力内容の検証
            await readAndValidateNewFormatYrtFile(outputFile);
        });

        test("XMLファイルで出力先を明示的に指定", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "06-xml-explicit-output");

            const inputFile = path.resolve("test/fixtures/legacy_complex.xml");
            const outputFile = path.join(testCaseDir, "custom_name.yrt");

            const result = await runYrtMigrate([
                inputFile,
                "-o", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(outputFile), true);
        });
    });

    describe("エラーケースのテスト", () => {
        test("存在しないファイルを指定した場合", async () => {
            const result = await runYrtMigrate(["nonexistent.xml"]);
            assert.strictEqual(result.exitCode, 1);
            assert(result.stderr.includes("ENOENT"));
        });

        test("非対応のファイル形式を指定した場合", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "07-invalid-file");

            const invalidFile = path.join(testCaseDir, "invalid.txt");
            await fs.writeFile(invalidFile, "This is not a valid file");

            const result = await runYrtMigrate([invalidFile]);
            assert.strictEqual(result.exitCode, 1);
            assert(result.stderr.includes("非対応のファイル形式です"));
        });
    });
});
