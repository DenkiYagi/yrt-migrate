// @ts-check

import { test, describe, before } from "node:test";
import assert from "node:assert";
import {
    runYrtMigrate,
    createTestCaseDir,
    setupTestOutputDir,
    readMigratedLayoutXmls,
    readMigratedStyleXml,
    prepareInputFile
} from "./test-utils.mjs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const TEST_OUT_DIR = fileURLToPath(new URL("../test-out/integration", import.meta.url));
const FIXTURES_DIR = fileURLToPath(new URL("./fixtures", import.meta.url));

/**
 * @param  {...string} segments - Path segments to join
 * @returns {string} The joined fixture filepath
 */
const fixturePath = (...segments) => join(FIXTURES_DIR, ...segments);

/**
 * 正規化したXML文字列を返す。改行コードと末尾改行の差異を吸収する。
 * @param {string} xml
 */
function normalizeXml(xml) {
    return xml.replace(/\r\n/g, "\n").trim();
}

describe("yrt-migrate 統合テスト", () => {
    before(async () => {
        await setupTestOutputDir(TEST_OUT_DIR);
    });

    describe("例: 最小構成のYRT/XML", () => {
        describe("マイグレート後のLayoutXMLの検証", () => {
            test("入力を反映して、StackLayoutが1つだけ生成される", async () => {
                const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "minimal-xml");
                const inputFile = await prepareInputFile(fixturePath("legacy_minimal.xml"), testCaseDir);
                const outputDir = join(testCaseDir, "output");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputDir
                ]);

                assert.strictEqual(result.exitCode, 0);

                const layouts = await readMigratedLayoutXmls(outputDir);
                assert.strictEqual(layouts.length, 1, "1つのLayoutXMLを含むべき");

                const layoutXml = layouts[0];
                assert(!layoutXml.includes("<LayoutXml>"), "<LayoutXml>要素を含まないこと");
                assert(layoutXml.includes("<StackLayout"), "ルート要素は<StackLayout>であること");
                assert(layoutXml.includes("Minimal Layout"), "入力されたテキスト内容を含むこと");
            });
        });

        describe("警告の検証", () => {
            test("入力を反映して、警告は何も出力されない", async () => {
                const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "minimal-xml-warning");
                const inputFile = await prepareInputFile(fixturePath("legacy_minimal.xml"), testCaseDir);
                const diagnosticsFile = join(testCaseDir, "warnings.log");
                const result = await runYrtMigrate([
                    inputFile,
                    "--diagnostics", diagnosticsFile
                ]);

                assert.strictEqual(result.exitCode, 0);
                const diagnosticsContent = await readFile(diagnosticsFile, "utf8");
                assert.strictEqual(diagnosticsContent, "", "警告は何も出力されないこと");
            });
        });

        describe("マイグレート後のStyleXMLの検証", () => {
            test("入力を反映して、StyleXMLは生成されない", async () => {
                const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "minimal-xml-style");
                const inputFile = await prepareInputFile(fixturePath("legacy_minimal.xml"), testCaseDir);
                const outputDir = join(testCaseDir, "output");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputDir
                ]);

                assert.strictEqual(result.exitCode, 0);

                const style = await readMigratedStyleXml(outputDir);
                assert.strictEqual(style, null, "StyleXMLを含まないこと");
            });
        });

        describe("マイグレート後のアセットの検証", () => {
            test("YRT入力の場合でもレイアウトは生成される（アセットは無視される）", async () => {
                const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "minimal-yrt-assets");
                const inputFile = await prepareInputFile(fixturePath("legacy_minimal.yrt"), testCaseDir, "input.yrt");
                const outputDir = join(testCaseDir, "output");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputDir
                ]);

                assert.strictEqual(result.exitCode, 0);

                const layouts = await readMigratedLayoutXmls(outputDir);
                assert.strictEqual(layouts.length, 1, "レイアウトXMLが生成されること");
            });
        });
    });

    describe("例: 複雑な構成のYRT/XML", () => {
        describe("マイグレート後のLayoutXMLの検証", () => {
            test("入力を反映して、2つのLayoutが生成され、属性値の変換も行われる", async () => {
                const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "complex-xml");
                const inputFile = await prepareInputFile(fixturePath("legacy_complex.xml"), testCaseDir);
                const outputDir = join(testCaseDir, "output");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputDir
                ]);

                assert.strictEqual(result.exitCode, 0);

                const layouts = await readMigratedLayoutXmls(outputDir);
                assert.strictEqual(layouts.length, 2, "2つのLayoutXMLを含むこと");

                const layout1Xml = layouts[0];
                assert(!layout1Xml.includes("<LayoutXml>"), "第1LayoutXMLは<LayoutXml>要素を含まないこと");
                assert(layout1Xml.includes("<StackLayout"), "第1LayoutXMLのルート要素は<StackLayout>であること");
                assert(layout1Xml.includes("First Layout"), "第1LayoutXMLのテキスト内容を含むこと");

                const layout2Xml = layouts[1];
                assert(!layout2Xml.includes("<LayoutXml>"), "第2LayoutXMLは<LayoutXml>要素を含まないこと");
                assert(layout2Xml.includes("<LinearLayout"), "第2LayoutXMLのルート要素は<LinearLayout>であること");
                assert(layout2Xml.includes("Second Layout"), "第2LayoutXMLのテキスト内容を含むこと");
                assert(layout2Xml.includes('color="R100G0B0"'), "色はR100G0B0形式に変換されること");
                assert(!layout2Xml.includes('color="rgb(1, 0, 0)"'), "元のrgb形式が残らないこと");
            });
        });

        describe("マイグレート後のStyleXMLの検証", () => {
            test("入力を反映して、StyleXMLが生成される", async () => {
                const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "complex-xml-style");
                const inputFile = await prepareInputFile(fixturePath("legacy_complex.xml"), testCaseDir);
                const outputDir = join(testCaseDir, "output");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputDir
                ]);

                assert.strictEqual(result.exitCode, 0);

                const style = await readMigratedStyleXml(outputDir);
                assert(style !== null, "StyleXMLを含むこと");
                assert(style.includes("<Style"), "StyleXMLのルート要素は<Style>であること");
                assert(style.includes("style-1"), "StyleXMLはstyle-1 (連番key名) を含むこと");
            });
        });

        describe("警告の検証", () => {
            test("入力を反映して、警告が出力される", async () => {
                const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "complex-xml-warning");
                const inputFile = await prepareInputFile(fixturePath("legacy_complex.xml"), testCaseDir);
                const diagnosticsFile = join(testCaseDir, "warnings.log");
                const result = await runYrtMigrate([
                    inputFile,
                    "--diagnostics", diagnosticsFile
                ]);

                assert.strictEqual(result.exitCode, 0);
                assert.strictEqual(result.stderr, "");
                const diagnosticsContent = await readFile(diagnosticsFile, "utf8");
                assert(diagnosticsContent.includes("Image要素にwidth属性がありません"), "警告が diagnostics ファイルに出力されること");
            });
        });

        describe("異なる入力形式に対するXML生成の一貫性の検証", () => {
            test("入力がYRT形式の場合も、入力がXML形式の場合と同じXMLとStyleを生成する", async () => {
                const testCaseDir = await createTestCaseDir(TEST_OUT_DIR, "complex-xml-yrt-compare");

                const inputFileLegacyXml = await prepareInputFile(fixturePath("legacy_complex.xml"), testCaseDir, "input.xml");
                const inputFileLegacyYrt = await prepareInputFile(fixturePath("legacy_complex.yrt"), testCaseDir, "input.yrt");

                const outputDirFromXml = join(testCaseDir, "from-xml");
                const outputDirFromYrt = join(testCaseDir, "from-yrt");

                const xmlResult = await runYrtMigrate([
                    "--input", inputFileLegacyXml,
                    "--output", outputDirFromXml
                ]);
                assert.strictEqual(xmlResult.exitCode, 0);

                const yrtResult = await runYrtMigrate([
                    "--input", inputFileLegacyYrt,
                    "--output", outputDirFromYrt
                ]);
                assert.strictEqual(yrtResult.exitCode, 0);

                const layoutsFromXml = await readMigratedLayoutXmls(outputDirFromXml);
                const layoutsFromYrt = await readMigratedLayoutXmls(outputDirFromYrt);

                assert.strictEqual(layoutsFromXml.length, layoutsFromYrt.length, "LayoutXML数が一致すること");
                for (let i = 0; i < layoutsFromXml.length; i += 1) {
                    assert.strictEqual(
                        normalizeXml(layoutsFromXml[i]),
                        normalizeXml(layoutsFromYrt[i]),
                        `Layout ${i} が一致すること`
                    );
                }

                const styleFromXml = await readMigratedStyleXml(outputDirFromXml);
                const styleFromYrt = await readMigratedStyleXml(outputDirFromYrt);
                assert.strictEqual(
                    styleFromXml && normalizeXml(styleFromXml),
                    styleFromYrt && normalizeXml(styleFromYrt),
                    "StyleXMLが一致すること"
                );
            });
        });
    });
});
