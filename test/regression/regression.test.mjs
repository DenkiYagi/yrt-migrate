/**
 * `test/regression/test-data` 以下のすべてのデータセットに対してリグレッションテストを実行します。
 *
 * 各ディレクトリから `input.xml` をコピーし、CLI (`yrt-migrate`) を実行して `.yrt` を生成します。
 * 生成された YRT をデコードし、各 LayoutXML（および必要なら StyleXML）を対応する `expected-*.xml` と比較。
 * さらに CLI の警告出力 (`stderr`) を `expected-warnings.txt` と照合します。
 * データセット名はハードコーディングせず、実行時にディレクトリ一覧を取得するため、
 * ローカルで未コミットのフィクスチャにも自動対応します。
 */

// @ts-check

import { describe, test, before } from "node:test";
import assert from "node:assert";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
    runYrtMigrate,
    setupTestOutputDir,
    createTestCaseDir,
    prepareInputFile,
    readAndValidateNewFormatYrtFile
} from "../test-utils.mjs";

const TEST_DATA_ROOT = "test/regression/test-data";
const TEST_OUT_ROOT = "test-out/regression";

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

const datasetDirEntries = await readdir(TEST_DATA_ROOT, { withFileTypes: true });
const datasetNames = datasetDirEntries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();

describe("リグレッションテスト", () => {
    before(async () => {
        await setupTestOutputDir(TEST_OUT_ROOT);
    });

    if (datasetNames.length === 0) {
        test.todo(`regression fixtures pending: add datasets under ${TEST_DATA_ROOT}`);
        return;
    }

    for (const datasetName of datasetNames) {
        test(`"${datasetName}" matches expected output`, async (t) => {
            const datasetDir = join(TEST_DATA_ROOT, datasetName);
            const testCaseDir = await createTestCaseDir(TEST_OUT_ROOT, datasetName);
            const inputFile = await prepareInputFile(join(datasetDir, "input.xml"), testCaseDir, "input.xml");
            const outputFile = join(testCaseDir, "output.yrt");
            const { exitCode, stderr } = await runYrtMigrate([
                "--input",
                inputFile,
                "--output",
                outputFile
            ]);

            assert.strictEqual(
                exitCode,
                0,
                `yrt-migrate exited with ${exitCode}. stderr: ${stderr}`
            );

            const yrt = await readAndValidateNewFormatYrtFile(outputFile);
            const body = yrt[2];

            const expectedLayouts = await loadExpectedLayouts(datasetDir);
            assert(expectedLayouts.length > 0, `No expected-*.xml files found in ${datasetDir}`);
            assert.strictEqual(
                body.l.length,
                expectedLayouts.length,
                `Layout count mismatch for dataset "${datasetName}"`
            );

            for (let i = 0; i < expectedLayouts.length; i += 1) {
                const [, actualXml] = body.l[i];
                const expectedXml = expectedLayouts[i];
                assert.strictEqual(
                    normalizeXml(actualXml),
                    normalizeXml(expectedXml),
                    `Layout ${i} does not match for dataset "${datasetName}"`
                );
            }

            const expectedStyle = await loadExpectedStyle(datasetDir);
            if (expectedStyle === null) {
                assert(
                    body.s == null,
                    `StyleXML was not expected but was generated for dataset "${datasetName}"`
                );
            } else {
                assert(
                    typeof body.s === "string",
                    `StyleXML expected but not generated for dataset "${datasetName}"`
                );
                assert.strictEqual(
                    normalizeXml(body.s),
                    normalizeXml(expectedStyle),
                    `StyleXML does not match for dataset "${datasetName}"`
                );
            }

            const expectedWarnings = await loadExpectedWarnings(datasetDir);
            assert(
                expectedWarnings !== null,
                `expected-warnings.txt not found in ${datasetDir}`
            );
            const warningsOutFile = join(testCaseDir, "warnings.actual.txt");
            const normalizedActualWarnings = normalizeWarnings(stderr);
            await writeFile(warningsOutFile, normalizedActualWarnings, "utf8");
            const expectedWarningsPath = join(datasetDir, "expected-warnings.txt");
            const expectedWarningLines = splitNormalizedLines(expectedWarnings);
            const actualWarningLines = splitNormalizedLines(normalizedActualWarnings);
            const maxLineCount = Math.max(actualWarningLines.length, expectedWarningLines.length);
            for (let i = 0; i < maxLineCount; i += 1) {
                assert.strictEqual(
                    actualWarningLines[i],
                    expectedWarningLines[i],
                    [
                        `Warning line ${i + 1} does not match for dataset "${datasetName}"`,
                        `expected: ${expectedWarningsPath}`,
                        `actual:   ${warningsOutFile}`
                    ].join("\n")
                );
            }
        });
    }
});
