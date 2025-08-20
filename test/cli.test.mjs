import { test, describe, before } from "node:test";
import assert from "node:assert";
import {
    runYrtMigrate,
    fileExists,
    createTestCaseDir,
    setupTestOutputDir,
    readAndValidateNewFormatYrtFile,
    prepareInputFile
} from "./test-utils.mjs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

describe("yrt-migrate CLIテスト", () => {
    const testOutDir = "test-out/cli";

    before(async () => {
        await setupTestOutputDir(testOutDir);
        // Note: YRT fixture files should be generated manually using:
        // node test/generate-fixtures.mjs
    });

    describe("引数なし / ヘルプ", () => {
        test("引数なしで実行すると、入力ファイルの指定を促すエラーメッセージを表示", async () => {
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
            assert(result.stdout.includes("--input"));
            assert(result.stdout.includes("--output"));
        });
    });

    describe("各種コマンドオプション（入力がXMLの場合）", () => {
        test("位置引数でXMLファイルを指定すると、同じディレクトリに同名の.yrtファイルが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "xml-positional-only");
            const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
            const result = await runYrtMigrate([inputFile]);

            assert.strictEqual(result.exitCode, 0);

            const expectedOutputFile = join(testCaseDir, "legacy_minimal.yrt");
            assert.strictEqual(await fileExists(expectedOutputFile), true, "同名の.yrtファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(expectedOutputFile);
        });

        test("位置引数でXMLファイルを指定し、-oで出力先を指定すると、指定したパスに変換結果が作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "xml-positional-with-output");
            const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
            const outputFile = join(testCaseDir, "custom_output.yrt");

            const result = await runYrtMigrate([
                inputFile,
                "--output", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            assert.strictEqual(await fileExists(outputFile), true, "指定した出力ファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(outputFile);
        });

        test("-iでXMLファイルを指定し、出力先を省略すると、入力ファイルと同じディレクトリに同名の.yrtファイルが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "xml-input-only");
            const inputFile = await prepareInputFile("test/fixtures/legacy_complex.xml", testCaseDir);
            const result = await runYrtMigrate(["--input", inputFile]);

            assert.strictEqual(result.exitCode, 0);

            const expectedOutputFile = join(testCaseDir, "legacy_complex.yrt");
            assert.strictEqual(await fileExists(expectedOutputFile), true, "同名の.yrtファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(expectedOutputFile);
        });

        test("-iでXMLファイルを指定し、-oで出力先を指定すると、指定したパスに変換結果が作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "xml-input-output-options");
            const inputFile = await prepareInputFile("test/fixtures/legacy_complex.xml", testCaseDir);
            const outputFile = join(testCaseDir, "converted.yrt");
            const result = await runYrtMigrate([
                "--input", inputFile,
                "--output", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            assert.strictEqual(await fileExists(outputFile), true, "指定した出力ファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(outputFile);
        });

        test("--dry-runオプションでXMLファイルを指定すると、ファイル出力せずに標準出力に変換結果が表示される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "xml-dry-run");
            const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
            const inputDataBeforeRun = await readFile(inputFile);
            const result = await runYrtMigrate([
                "--dry-run",
                inputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            // 標準出力への変換結果の確認
            assert(result.stdout.includes("=== Layout 0 ==="), "Layout情報がヘッダーと共に出力されること");
            assert(result.stdout.includes("<StackLayout"), "変換後のLayoutXMLが出力されること");
            assert(!result.stdout.includes("<LayoutXml>"), "<LayoutXml>要素は出力されないこと");

            // 入力ファイルが変更されていないことを確認
            const inputDataAfterRun = await readFile(inputFile);
            assert.deepStrictEqual(inputDataAfterRun, inputDataBeforeRun, "--dry-runでは入力ファイルが変更されないこと");

            // ディレクトリに入力ファイルのみが存在することを確認
            const files = await readdir(testCaseDir);
            assert.deepStrictEqual(files, [basename(inputFile)], "--dry-runでは新たなファイルが出力されないこと");
        });
    });

    describe("各種コマンドオプション（入力がYRTの場合）", () => {
        test("位置引数でYRTファイルを指定すると、元ファイルが上書きされ自動バックアップが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "yrt-positional-only");
            const inputFile = await prepareInputFile("test/fixtures/legacy_complex.yrt", testCaseDir);

            // 元のファイル内容を記録
            const inputData = await readFile(inputFile);

            const result = await runYrtMigrate([inputFile]);

            assert.strictEqual(result.exitCode, 0);

            // 元ファイルがインプレースで変換されていることを確認
            await readAndValidateNewFormatYrtFile(inputFile);

            // 自動バックアップファイルの存在確認
            const backupFile = join(testCaseDir, "legacy_complex.yrt.old");
            assert.strictEqual(await fileExists(backupFile), true, "自動バックアップファイルが作成されること");

            // バックアップファイルが元のデータを保持していることを確認
            const backupData = await readFile(backupFile);
            assert.deepStrictEqual(backupData, inputData, "バックアップファイルが元のデータを保持していること");
        });

        test("位置引数でYRTファイルを指定し、-oで出力先を指定すると、指定したパスに変換結果が作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "yrt-positional-with-output");
            const inputFile = await prepareInputFile("test/fixtures/legacy_complex.yrt", testCaseDir);
            const outputFile = join(testCaseDir, "converted.yrt");

            const result = await runYrtMigrate([
                inputFile,
                "--output", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            assert.strictEqual(await fileExists(outputFile), true, "指定した出力ファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(outputFile);

            // 元の入力ファイルは変更されていないことを確認
            const originalData = await readFile("test/fixtures/legacy_complex.yrt");
            const inputData = await readFile(inputFile);
            assert.deepStrictEqual(originalData, inputData, "元の入力ファイルは変更されないこと");
        });

        test("-iでYRTファイルを指定し、出力先を省略すると、元ファイルが上書きされ自動バックアップが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "yrt-input-only");
            const inputFile = await prepareInputFile("test/fixtures/legacy_complex.yrt", testCaseDir);

            // 元のファイル内容を記録
            const inputData = await readFile(inputFile);

            const result = await runYrtMigrate([
                "--input", inputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            // 元ファイルがインプレースで変換されていることを確認
            await readAndValidateNewFormatYrtFile(inputFile);

            // 自動バックアップファイルの存在確認
            const backupFile = join(testCaseDir, "legacy_complex.yrt.old");
            assert.strictEqual(await fileExists(backupFile), true, "自動バックアップファイルが作成されること");

            // バックアップファイルが元のデータを保持していることを確認
            const backupData = await readFile(backupFile);
            assert.deepStrictEqual(backupData, inputData, "バックアップファイルが元のデータを保持していること");
        });

        test("-iでYRTファイルを指定し、-oで出力先を指定すると、指定したパスに変換結果が作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "yrt-input-output-options");
            const inputFile = await prepareInputFile("test/fixtures/legacy_complex.yrt", testCaseDir);
            const outputFile = join(testCaseDir, "converted.yrt");

            const result = await runYrtMigrate([
                "--input", inputFile,
                "--output", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            assert.strictEqual(await fileExists(outputFile), true, "指定した出力ファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(outputFile);

            // 元の入力ファイルは変更されていないことを確認
            const originalData = await readFile("test/fixtures/legacy_complex.yrt");
            const inputData = await readFile(inputFile);
            assert.deepStrictEqual(originalData, inputData, "元の入力ファイルは変更されないこと");
        });

        test("-iでYRTファイルを指定し、-bで明示的にバックアップ先を指定すると、元ファイルが上書きされ指定したバックアップが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "yrt-input-with-backup");
            const inputFile = await prepareInputFile("test/fixtures/legacy_complex.yrt", testCaseDir);

            // 元のファイル内容を記録
            const inputData = await readFile(inputFile);

            const backupFile = join(testCaseDir, "custom_backup.yrt");

            const result = await runYrtMigrate([
                "--input", inputFile,
                "--backup", backupFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            // 元ファイルがインプレースで変換されていることを確認
            await readAndValidateNewFormatYrtFile(inputFile);

            // 指定したバックアップファイルが作成されることを確認
            assert.strictEqual(await fileExists(backupFile), true, "指定したバックアップファイルが作成されること");

            // バックアップファイルが元のデータを保持していることを確認
            const backupData = await readFile(backupFile);
            assert.deepStrictEqual(backupData, inputData, "バックアップファイルが元のデータを保持していること");
        });

        test("--dry-runオプションでYRTファイルを指定すると、ファイル出力せずに標準出力に変換結果が表示される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "yrt-dry-run");
            const inputFile = await prepareInputFile("test/fixtures/legacy_complex.yrt", testCaseDir);
            const inputDataBeforeRun = await readFile(inputFile);
            const result = await runYrtMigrate([
                "--input", inputFile,
                "--dry-run"
            ]);

            // 警告があっても正常終了することを確認（警告は stderr に出力される）
            assert.strictEqual(result.exitCode, 0);

            // 標準出力への変換結果の確認
            assert(result.stdout.includes("=== Layout 0 ==="), "Layout情報がヘッダーと共に出力されること");
            assert(result.stdout.includes("<LinearLayout"), "変換後のLayoutXMLが出力されること");
            assert(!result.stdout.includes("<LayoutXml>"), "<LayoutXml>要素は出力されないこと");

            // 入力ファイルが変更されていないことを確認
            const inputDataAfterRun = await readFile(inputFile);
            assert.deepStrictEqual(inputDataAfterRun, inputDataBeforeRun, "--dry-runでは入力ファイルが変更されないこと");

            // ディレクトリに入力ファイルのみが存在することを確認
            const files = await readdir(testCaseDir);
            assert.deepStrictEqual(files, [basename(inputFile)], "--dry-runでは新たなファイルが出力されないこと");
        });
    });

    describe("異常ケース", () => {
        test("入力として存在しないファイルを指定すると、生のENOENTエラーが出力される", async () => {
            const result = await runYrtMigrate(["nonexistent.xml"]);
            assert.strictEqual(result.exitCode, 1);
            assert(result.stderr.includes("ENOENT"));
        });

        test("入力として無関係な形式のファイルを指定すると、非対応の形式である旨のエラーメッセージが出力される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "invalid-file");

            const invalidFile = join(testCaseDir, "invalid.txt");
            await writeFile(invalidFile, "This is not a valid file");

            const result = await runYrtMigrate([invalidFile]);
            assert.strictEqual(result.exitCode, 1);
            assert(result.stderr.includes("非対応のファイル形式です"));
        });

        test("既にマイグレーション済みのYRTファイルを指定すると、警告を出して正常終了する", async () => {
            // 既にマイグレーション済みのYRTファイルを用意
            const testCaseDir = await createTestCaseDir(testOutDir, "already-migrated");
            // test/fixtures/legacy_minimal.xml → 変換 → .yrt → もう一度変換
            const inputXml = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
            // 1回目: XML→YRT
            const firstResult = await runYrtMigrate([inputXml]);
            assert.strictEqual(firstResult.exitCode, 0);
            const migratedYrt = join(testCaseDir, "legacy_minimal.yrt");
            // 2回目: 既にマイグレーション済みのYRTを再度変換
            const secondResult = await runYrtMigrate([migratedYrt]);
            assert.strictEqual(secondResult.exitCode, 0);
            assert(secondResult.stderr.includes("このYRTファイルはすでにマイグレーション済みです。処理をスキップします。"), "警告メッセージが出力されること");
        });
    });
});
