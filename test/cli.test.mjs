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
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, parse } from "node:path";

/**
 * Codex sandbox では child_process の stdout/stderr が空になることがあるため、
 * 出力が取得できた環境でのみ文言を検証する。
 * @param {import("node:test").TestContext} t
 * @param {string[]} outputs
 * @param {string[]} expectedSubstrings
 */
function assertOutputIncludesWhenAvailable(t, outputs, expectedSubstrings) {
    const availableOutputs = outputs.filter(output => output.length > 0);
    if (availableOutputs.length === 0) {
        t.skip("stdout/stderr is empty in this environment");
        return;
    }

    expectedSubstrings.forEach(expectedSubstring => {
        assert(availableOutputs.some(output => output.includes(expectedSubstring)));
    });
}

/**
 * @param {import("node:test").TestContext} t
 * @param {string[]} outputs
 * @param {string[]} expectedAlternatives
 */
function assertOutputIncludesAnyWhenAvailable(t, outputs, expectedAlternatives) {
    const availableOutputs = outputs.filter(output => output.length > 0);
    if (availableOutputs.length === 0) {
        t.skip("stdout/stderr is empty in this environment");
        return;
    }

    assert(
        expectedAlternatives.some(expectedAlternative =>
            availableOutputs.some(output => output.includes(expectedAlternative))
        )
    );
}

/**
 * @param {string} inputFilePath
 * @returns {string}
 */
function defaultAlpha13OutputDir(inputFilePath) {
    const parsed = parse(inputFilePath);
    const parentDir = parsed.dir === "" ? "." : parsed.dir;
    return join(parentDir, `${parsed.name}-2025.1`);
}

/**
 * @param {string} inputPath
 * @param {boolean} isDirectory
 * @returns {string}
 */
function default2025_1OutputDir(inputPath, isDirectory) {
    if (isDirectory) {
        const normalized = inputPath.replace(/[/\\]+$/u, "");
        const { dir, base } = parse(normalized);
        const parentDir = dir === "" ? "." : dir;
        const baseName = base.replace(/-(?:v1\.0|2025\.1)$/u, "");
        return join(parentDir, `${baseName}-2026.1`);
    }

    const parsed = parse(inputPath);
    if (parsed.dir === "" || parsed.dir === ".") {
        return join(".", `${parsed.name}-2026.1`);
    }

    const parentDir = dirname(parsed.dir) === "" ? "." : dirname(parsed.dir);
    const baseName = basename(parsed.dir).replace(/-(?:v1\.0|2025\.1)$/u, "");
    return join(parentDir, `${baseName}-2026.1`);
}

describe("yrt-migrate CLIテスト", () => {
    const testOutDir = "test-out/cli";

    before(async () => {
        await setupTestOutputDir(testOutDir);
    });

    describe("共通", () => {
        test("引数なしで実行すると、エラー終了する", async () => {
            const result = await runYrtMigrate([]);
            assert.strictEqual(result.exitCode, 1);
        });

        test("--helpオプションで成功する", async () => {
            const result = await runYrtMigrate(["--help"]);
            assert.strictEqual(result.exitCode, 0);
        });

        test("未知のオプションを指定すると、usage付きで失敗終了する", async (t) => {
            const result = await runYrtMigrate(["--unknown"]);
            assert.strictEqual(result.exitCode, 1);
            assertOutputIncludesWhenAvailable(t, [result.stdout], ["Usage: npx yrt-migrate"]);
            assertOutputIncludesAnyWhenAvailable(t, [result.stderr], [
                "ERR_PARSE_ARGS_UNKNOWN_OPTION",
                "Unknown option"
            ]);
        });

        test("未対応のスキーマバージョンを指定すると、失敗終了する", async (t) => {
            const result = await runYrtMigrate(["--from", "9999.1", "input.xml"]);
            assert.strictEqual(result.exitCode, 1);
            assertOutputIncludesWhenAvailable(t, [result.stderr], ["未対応のスキーマバージョンです"]);
        });

        test("`-f` でもマイグレーション元のスキーマバージョンを指定できる", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "alpha13-short-from");
            const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
            const outputDir = join(testCaseDir, "out");

            const result = await runYrtMigrate([
                "-f", "alpha13",
                inputFile,
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

    describe("`--from alpha13`", () => {
        test("`--from alpha13` を指定してもファイル入力がなければ、失敗終了する", async (t) => {
            const result = await runYrtMigrate(["--from", "alpha13"]);
            assert.strictEqual(result.exitCode, 1);
            assertOutputIncludesWhenAvailable(t, [result.stderr], ["入力ファイルまたはディレクトリを指定してください"]);
        });

        test("`--from alpha13` で存在しない入力ファイルを指定すると、失敗終了する", async (t) => {
            const result = await runYrtMigrate(["--from", "alpha13", "missing.xml"]);
            assert.strictEqual(result.exitCode, 1);
            assertOutputIncludesWhenAvailable(t, [result.stderr], ["入力ファイルの検証に失敗しました"]);
        });

        test("`--from alpha13` は `--output` で指定したパスへ出力できる", async () => {
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

        test("`--from alpha13` は `--output` 省略時に既定ディレクトリへ出力できる", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "alpha13-default-output");
            const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
            const outputDir = defaultAlpha13OutputDir(inputFile);

            const result = await runYrtMigrate([
                "--from", "alpha13",
                inputFile
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(join(outputDir, "layout-1.xml")), true);
        });

        test("`--from alpha13` の dry-run は short option 経由でも出力せず結果だけ表示する", async (t) => {
            const testCaseDir = await createTestCaseDir(testOutDir, "alpha13-dry-run-short-option");
            const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
            const outputDir = join(testCaseDir, "out");

            const result = await runYrtMigrate([
                "--from", "alpha13",
                inputFile,
                "-o", outputDir,
                "-d"
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(outputDir), false);
            assertOutputIncludesWhenAvailable(t, [result.stdout], ["=== Layout 1 ==="]);
        });

        test("`--from alpha13` は CLI 経由で diagnostics ファイルへ警告を書き出せる", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "alpha13-diagnostics");
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

            const result = await runYrtMigrate([
                "--from", "alpha13",
                inputFile,
                "--diagnostics", diagnosticsFile,
                "--dry-run"
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(diagnosticsFile), true);
            const diagnosticsContent = await readFile(diagnosticsFile, "utf8");
            assert(diagnosticsContent.includes("[WARNING]"));
            assert(diagnosticsContent.includes("foreach属性とhidden属性が同時に指定されている"));
            assert(!result.stderr.includes("foreach属性とhidden属性が同時に指定されている"));
        });
    });

    describe("`--from 2025.1`", () => {
        test("`--from 2025.1` を指定してもファイル入力がなければ、失敗終了する", async (t) => {
            const result = await runYrtMigrate(["--from", "2025.1"]);
            assert.strictEqual(result.exitCode, 1);
            assertOutputIncludesWhenAvailable(t, [result.stderr], ["入力ファイルまたはディレクトリを指定してください"]);
        });

        test("`--from 2025.1` で存在しない入力パスを指定すると、失敗終了する", async (t) => {
            const result = await runYrtMigrate(["--from", "2025.1", "missing-v1.0/layout-1.xml"]);
            assert.strictEqual(result.exitCode, 1);
            assertOutputIncludesWhenAvailable(t, [result.stderr], ["入力パスが見つかりません"]);
        });

        test("`--from 2025.1` は `--output` で指定したパスへ出力できる", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "2025_1-input-smoke");
            const inputDir = join(testCaseDir, "bundle-v1.0");
            const outputDir = join(testCaseDir, "out");
            await mkdir(inputDir, { recursive: true });
            await writeFile(join(inputDir, "layout-1.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

            const result = await runYrtMigrate([
                "--from", "2025.1",
                inputDir,
                "--output", outputDir
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(join(outputDir, "layout-1.xml")), true);
        });

        test("`--from 2025.1` は `--output` 省略時に既定ディレクトリへ出力できる", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "2025_1-default-output");
            const inputDir = join(testCaseDir, "bundle-v1.0");
            const outputDir = default2025_1OutputDir(inputDir, true);
            await mkdir(inputDir, { recursive: true });
            await writeFile(join(inputDir, "layout-1.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

            const result = await runYrtMigrate([
                "--from", "2025.1",
                inputDir
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(join(outputDir, "layout-1.xml")), true);
        });

        test("`--from 2025.1` は `-2025.1` ディレクトリ入力でも既定出力先を正規化できる", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "2025_1-default-output-from-2025_1");
            const inputDir = join(testCaseDir, "bundle-2025.1");
            const outputDir = default2025_1OutputDir(inputDir, true);
            await mkdir(inputDir, { recursive: true });
            await writeFile(join(inputDir, "layout-1.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

            const result = await runYrtMigrate([
                "--from", "2025.1",
                inputDir
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(join(outputDir, "layout-1.xml")), true);
            assert.strictEqual(await fileExists(join(testCaseDir, "bundle-2025.1-2026.1")), false);
        });

        test("`--from 2025.1` の dry-run は short option 経由でも出力せず結果だけ表示する", async (t) => {
            const testCaseDir = await createTestCaseDir(testOutDir, "2025_1-dry-run-short-option");
            const inputDir = join(testCaseDir, "bundle-v1.0");
            const outputDir = join(testCaseDir, "out");
            await mkdir(inputDir, { recursive: true });
            await writeFile(join(inputDir, "layout-1.xml"), '<StackLayout orientation="portrait"><LayoutBody/></StackLayout>', "utf8");

            const result = await runYrtMigrate([
                "--from", "2025.1",
                inputDir,
                "-o", outputDir,
                "-d"
            ]);

            assert.strictEqual(result.exitCode, 0);
            assert.strictEqual(await fileExists(outputDir), false);
            assertOutputIncludesWhenAvailable(t, [result.stdout], ["=== layout-1.xml ==="]);
        });
    });
});
