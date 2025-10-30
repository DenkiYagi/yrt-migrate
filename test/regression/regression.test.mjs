/**
 * `test/regression/test-data` 以下のすべてのデータセットに対してリグレッションテストを実行します。
 *
 * 各ディレクトリの `input.xml` を直接CLI (`yrt-migrate`) に渡して変換後の LayoutXML / StyleXML を取得します。
 * 生成されたファイルを対応する `expected-*.xml` と比較します。
 * さらに CLI の警告出力を `expected-warnings.txt` と照合します。
 * データセット名はハードコーディングせず、実行時にディレクトリ一覧を取得するため、
 * ローカルで未コミットのフィクスチャにも自動対応します。
 */

// @ts-check

import { describe, test, before } from "node:test";
import assert from "node:assert";
import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
    runYrtMigrate,
    setupTestOutputDir,
    createTestCaseDir,
    readMigratedLayoutXmls,
    readMigratedStyleXml
} from "../test-utils.mjs";

/**
 * 正規化したXML文字列を返す。改行コードと末尾改行の差異を吸収する。
 * @param {string} xml
 */
function normalizeXml(xml) {
    return xml.replace(/\r\n/g, "\n").trim();
}

/**
 * 警告メッセージを正規化し、末尾の改行差異などを吸収する。
 * @param {string} warnings
 */
function normalizeWarnings(warnings) {
    return warnings.replace(/\r\n/g, "\n").trim();
}

/**
 * @param {string} text 
 * @returns {string[]}
 */
function splitNormalizedLines(text) {
    return text === "" ? [] : text.split("\n");
}

/**
 * `[WARNING]` で始まる行を基点に警告ブロックを分割する。
 * @param {string} text
 * @returns {string[]}
 */
function splitWarningBlocks(text) {
    const lines = splitNormalizedLines(text);
    if (lines.length === 0) return [];
    /** @type {string[][]} */
    const blocks = [];
    /** @type {string[]} */
    let current = [];
    for (const line of lines) {
        if (line.startsWith("[WARNING]")) {
            if (current.length > 0) {
                blocks.push(current);
            }
            current = [line];
        } else if (current.length > 0) {
            current.push(line);
        }
    }
    if (current.length > 0) {
        blocks.push(current);
    }
    return blocks.map(block => block.join("\n"));
}

/**
 * 指定したディレクトリの expected-*.xml を読み込み、インデックス順に並べる。
 * @param {string} datasetDir
 */
async function loadExpectedLayouts(datasetDir) {
    const entries = await readdir(datasetDir);
    const expectedFiles = entries
        .filter(name => /^expected-\d+\.xml$/u.test(name))
        .map(name => ({
            name,
            index: Number(name.match(/^expected-(\d+)\.xml$/u)?.[1] ?? NaN)
        }))
        .filter(({ index }) => Number.isInteger(index))
        .sort((a, b) => a.index - b.index);

    const expectedXmls = [];
    for (const { name } of expectedFiles) {
        const filePath = join(datasetDir, name);
        expectedXmls.push(await readFile(filePath, "utf8"));
    }
    return expectedXmls;
}

/**
 * スタイルXMLが期待されていれば読み込む。
 * @param {string} datasetDir
 */
async function loadExpectedStyle(datasetDir) {
    try {
        return await readFile(join(datasetDir, "expected-style.xml"), "utf8");
    } catch {
        return null;
    }
}

/**
 * 保存済みの警告メッセージ期待値を読み込む。
 * @param {string} datasetDir
 */
async function loadExpectedWarnings(datasetDir) {
    try {
        const data = await readFile(join(datasetDir, "expected-warnings.txt"), "utf8");
        return normalizeWarnings(data);
    } catch {
        return null;
    }
}

describe("リグレッションテスト", async () => {
    /** @type {string | undefined} */
    let testDataRootDir;
    /** @type {string | undefined} */
    let testOutRootDir;
    /** @type {string[] | undefined} */
    let datasetNames;

    before(async () => {
        testDataRootDir = fileURLToPath(new URL("./test-data", import.meta.url));
        testOutRootDir = fileURLToPath(new URL("../../test-out/regression", import.meta.url));

        const datasetDirEntries = await readdir(testDataRootDir, { withFileTypes: true });
        datasetNames = datasetDirEntries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .sort();

        await setupTestOutputDir(testOutRootDir);
    });

    test('iterate test datasets', async (t) => {
        if (!datasetNames) assert.fail("Test setup failed: datasetNames is unspecified");
        if (datasetNames.length === 0) {
            t.todo(`regression fixtures pending: add datasets under ${testDataRootDir}`);
            return;
        }

        for (const datasetName of datasetNames) {
            await t.test(`"${datasetName}" matches expected output`, async (subTestCtx) => {
                if (!testDataRootDir) assert.fail("Test setup failed: testDataRootDir is unspecified");
                if (!testOutRootDir) assert.fail("Test setup failed: testOutRootDir is unspecified");
                const datasetDir = join(testDataRootDir, datasetName);
                const testCaseDir = await createTestCaseDir(testOutRootDir, datasetName);
                const datasetInputPath = join(datasetDir, "input.xml");
                const inputFileRelative = relative(process.cwd(), datasetInputPath);
                const inputFile = inputFileRelative.split(sep).join("/");
                const outputDir = join(testCaseDir, "output");
                const diagnosticsFile = join(testCaseDir, "diagnostics.log");
                const { exitCode, stderr } = await runYrtMigrate([
                    "--input",
                    inputFile,
                    "--output",
                    outputDir,
                    "--diagnostics",
                    diagnosticsFile
                ]);

                assert.strictEqual(
                    exitCode,
                    0,
                    `yrt-migrate exited with ${exitCode}. stderr: ${stderr}`
                );

                const expectedLayouts = await loadExpectedLayouts(datasetDir);
                assert(expectedLayouts.length > 0, `No expected-*.xml files found in ${datasetDir}`);
                const actualLayouts = await readMigratedLayoutXmls(outputDir);
                assert.strictEqual(actualLayouts.length, expectedLayouts.length, `Layout count mismatch for dataset "${datasetName}"`);

                for (let i = 0; i < expectedLayouts.length; i += 1) {
                    const expectedXml = expectedLayouts[i];
                    assert.strictEqual(
                        normalizeXml(actualLayouts[i]),
                        normalizeXml(expectedXml),
                        `Layout ${i} does not match for dataset "${datasetName}"`
                    );
                }

                const expectedStyle = await loadExpectedStyle(datasetDir);
                const actualStyle = await readMigratedStyleXml(outputDir);
                if (expectedStyle === null) {
                    assert(
                        actualStyle == null,
                        `StyleXML was not expected but was generated for dataset "${datasetName}"`
                    );
                } else {
                    assert(
                        typeof actualStyle === "string",
                        `StyleXML expected but not generated for dataset "${datasetName}"`
                    );
                    assert.strictEqual(
                        normalizeXml(actualStyle),
                        normalizeXml(expectedStyle),
                        `StyleXML does not match for dataset "${datasetName}"`
                    );
                }

                const expectedWarnings = await loadExpectedWarnings(datasetDir);
                assert(
                    expectedWarnings !== null,
                    `expected-warnings.txt not found in ${datasetDir}`
                );
                const expectedWarningsPath = join(datasetDir, "expected-warnings.txt");
                const expectedWarningBlocks = splitWarningBlocks(expectedWarnings);
                const actualDiagnostics = normalizeWarnings(await readFile(diagnosticsFile, "utf8"));
                const actualWarningBlocks = splitWarningBlocks(actualDiagnostics);
                const maxWarningCount = Math.max(actualWarningBlocks.length, expectedWarningBlocks.length);
                for (let i = 0; i < maxWarningCount; i += 1) {
                    assert.strictEqual(
                        actualWarningBlocks[i],
                        expectedWarningBlocks[i],
                        [
                            `Warning ${i + 1} does not match for dataset "${datasetName}"`,
                            `expected warnings:  ${expectedWarningsPath}`,
                            `actual diagnostics: ${diagnosticsFile}`
                        ].join("\n")
                    );
                }
            });
        }
    });
});
