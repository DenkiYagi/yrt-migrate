// @ts-check

import { test, describe, before } from "node:test";
import assert from "node:assert";
import {
    runYrtMigrate,
    fileExists,
    createTestCaseDir,
    setupTestOutputDir,
    prepareInputFile
} from "./test-utils.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

describe("yrt-migrate CLIテスト", () => {
    const testOutDir = "test-out/cli";

    before(async () => {
        await setupTestOutputDir(testOutDir);
    });

    describe("CLI契約", () => {
        test("引数なしで実行すると、エラー終了する", async () => {
            const result = await runYrtMigrate([]);
            assert.strictEqual(result.exitCode, 1);
        });

        test("--helpオプションで成功する", async () => {
            const result = await runYrtMigrate(["--help"]);
            assert.strictEqual(result.exitCode, 0);
        });

        test("未対応のスキーマバージョンを指定すると、失敗終了する", async () => {
            const result = await runYrtMigrate(["--from", "9999.1", "input.xml"]);
            assert.strictEqual(result.exitCode, 1);
        });
    });

    describe("migration integration の smoke", () => {
        test("alpha13 は位置引数入力を受け取り、指定出力先へ変換できる", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "alpha13-positional-smoke");
            const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
            const outputDir = join(testCaseDir, "out");

            const result = await runYrtMigrate([
                "--from", "alpha13",
                inputFile,
                "--output", outputDir
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(join(outputDir, "layout-1.xml")), true);
        });

        test("2025.1 は --input でディレクトリ入力を受け取り、指定出力先へ変換できる", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "2025_1-input-smoke");
            const inputDir = join(testCaseDir, "bundle-v1.0");
            const outputDir = join(testCaseDir, "out");
            await mkdir(inputDir, { recursive: true });
            await writeFile(join(inputDir, "layout-1.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

            const result = await runYrtMigrate([
                "--from", "2025.1",
                "--input", inputDir,
                "--output", outputDir
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(join(outputDir, "layout-1.xml")), true);
        });

        test("migration が例外を投げたとき、CLI は失敗終了する", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "migration-error");
            const inputFile = join(testCaseDir, "invalid.txt");
            await writeFile(inputFile, "plain text", "utf8");

            const result = await runYrtMigrate(["--from", "alpha13", inputFile]);

            assert.strictEqual(result.exitCode, 1);
        });
    });
});
