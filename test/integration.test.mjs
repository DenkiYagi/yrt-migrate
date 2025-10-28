// @ts-check

import { test, describe, before } from "node:test";
import assert from "node:assert";
import {
    runYrtMigrate,
    createTestCaseDir,
    setupTestOutputDir,
    readAndValidateNewFormatYrtFile,
    prepareInputFile
} from "./test-utils.mjs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

describe("yrt-migrate 統合テスト", () => {
    const testOutDir = "test-out/integration";

    before(async () => {
        await setupTestOutputDir(testOutDir);
        // Note: YRT fixture files should be generated manually using:
        // node test/generate-fixtures.mjs
    });

    describe("例: 最小構成のYRT/XML", () => {
        describe("マイグレート後のLayoutXMLの検証", () => {
            test("入力を反映して、StackLayoutが1つだけ生成される", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "minimal-xml");
                const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
                const outputFile = join(testCaseDir, "output.yrt");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputFile
                ]);

                assert.strictEqual(result.exitCode, 0);

                // YRT内容の詳細検証
                const yrt = await readAndValidateNewFormatYrtFile(outputFile);
                const body = yrt[2];

                // LayoutXMLの数の確認
                assert.strictEqual(body.l.length, 1, "1つのLayoutXMLを含むべき");

                // LayoutXMLの内容確認
                const [layoutName, layoutXml] = body.l[0];
                assert.strictEqual(layoutName, null, "レイアウト名はnullであること");
                assert(!layoutXml.includes("<LayoutXml>"), "<LayoutXml>要素を含まないこと");
                assert(layoutXml.includes("<StackLayout"), "ルート要素は<StackLayout>であること");
                assert(layoutXml.includes("Minimal Layout"), "入力されたテキスト内容を含むこと");
            });
        });

        describe("警告の検証", () => {
            test("入力を反映して、警告は何も出力されない", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "minimal-xml-warning");
                const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
                const result = await runYrtMigrate([inputFile]);

                assert.strictEqual(result.exitCode, 0);
                assert.strictEqual(result.stderr, "", "警告は何も出力されないこと");
            });
        });

        describe("マイグレート後のStyleXMLの検証", { skip: true }, () => {
            // TODO: 現在のバグ - 最小XMLでもStyleXMLが生成されてしまう（後で修正予定）
            // 修正後にskipを削除して以下のテストを有効化する
            test("入力を反映して、StyleXMLは生成されない", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "minimal-xml-style");
                const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
                const outputFile = join(testCaseDir, "output.yrt");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputFile
                ]);

                assert.strictEqual(result.exitCode, 0);

                const yrt = await readAndValidateNewFormatYrtFile(outputFile);
                const body = yrt[2];

                assert.strictEqual(body.s, null, "StyleXMLを含まないこと");
            });
        });

        describe("マイグレート後のアセットの検証", () => {
            test("YRT入力の場合、アセットが正しく保持される", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "minimal-yrt-assets");
                const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.yrt", testCaseDir, "input.yrt");
                const outputFile = join(testCaseDir, "output.yrt");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputFile
                ]);

                assert.strictEqual(result.exitCode, 0);

                const yrt = await readAndValidateNewFormatYrtFile(outputFile);

                assert.strictEqual(yrt[2].a, null, "入力されたYRTと同様、アセットを含まないこと");
            });

            test("XML入力の場合、アセットは含まれない", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "minimal-xml-assets");
                const inputFile = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir);
                const outputFile = join(testCaseDir, "output.yrt");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputFile
                ]);

                assert.strictEqual(result.exitCode, 0);

                const yrt = await readAndValidateNewFormatYrtFile(outputFile);
                const body = yrt[2];

                assert.strictEqual(body.a, null, "XML入力の場合はアセットを含まないこと");
            });
        });

        describe("異なる入力形式に対するXML生成の一貫性の検証", () => {
            test("入力がYRT形式の場合も、入力がXML形式の場合と完全に同じXMLを生成する", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "minimal-xml-yrt-compare");

                // XML入力からの変換
                const inputFileLegacyXml = await prepareInputFile("test/fixtures/legacy_minimal.xml", testCaseDir, "input.xml");
                const outputFileFromLegacyXml = join(testCaseDir, "from-xml.yrt");

                const resultFromLegacyXml = await runYrtMigrate([
                    "--input", inputFileLegacyXml,
                    "--output", outputFileFromLegacyXml
                ]);
                assert.strictEqual(resultFromLegacyXml.exitCode, 0);

                // YRT入力からの変換
                const inputFileLegacyYrt = await prepareInputFile("test/fixtures/legacy_minimal.yrt", testCaseDir, "input.yrt");
                const outputFileFromLegacyYrt = join(testCaseDir, "from-yrt.yrt");

                const resultFromLegacyYrt = await runYrtMigrate([
                    "--input", inputFileLegacyYrt,
                    "--output", outputFileFromLegacyYrt
                ]);
                assert.strictEqual(resultFromLegacyYrt.exitCode, 0);

                // 結果の比較
                const yrtFromLegacyXml = await readAndValidateNewFormatYrtFile(outputFileFromLegacyXml);
                const yrtFromLegacyYrt = await readAndValidateNewFormatYrtFile(outputFileFromLegacyYrt);

                const bodyFromXml = yrtFromLegacyXml[2];
                const bodyFromYrt = yrtFromLegacyYrt[2];

                // 全XMLが同じであることを確認（アセットは除外）
                assert.deepStrictEqual(bodyFromXml.l, bodyFromYrt.l, "LayoutXMLsの内容が完全に一致すること");
                assert.strictEqual(bodyFromXml.s, bodyFromYrt.s, "StyleXMLの内容が完全に一致すること");
            });
        });
    });

    describe("例: 複雑な構成のYRT/XML", () => {
        describe("マイグレート後のLayoutXMLの検証", () => {
            test("入力を反映して、2つのLayoutが生成され、属性値の変換も行われる", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "complex-xml");
                const inputFile = await prepareInputFile("test/fixtures/legacy_complex.xml", testCaseDir);
                const outputFile = join(testCaseDir, "output.yrt");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputFile
                ]);

                assert.strictEqual(result.exitCode, 0);

                // YRT内容の詳細検証
                const yrt = await readAndValidateNewFormatYrtFile(outputFile);
                const body = yrt[2];

                // LayoutXMLの数の確認
                assert.strictEqual(body.l.length, 2, "2つのLayoutXMLを含むこと");

                // 第1LayoutXMLの内容確認
                const [layout1Name, layout1Xml] = body.l[0];
                assert.strictEqual(layout1Name, null, "第1レイアウト名はnullであること");
                assert(!layout1Xml.includes("<LayoutXml>"), "第1LayoutXMLは<LayoutXml>要素を含まないこと");
                assert(layout1Xml.includes("<StackLayout"), "第1LayoutXMLのルート要素は<StackLayout>であること");
                assert(layout1Xml.includes("First Layout"), "第1LayoutXMLのテキスト内容を含むこと");

                // 第2LayoutXMLの内容確認
                const [layout2Name, layout2Xml] = body.l[1];
                assert.strictEqual(layout2Name, null, "第2レイアウト名はnullであること");
                assert(!layout2Xml.includes("<LayoutXml>"), "第2LayoutXMLは<LayoutXml>要素を含まないこと");
                assert(layout2Xml.includes("<LinearLayout"), "第2LayoutXMLのルート要素は<LinearLayout>であること");
                assert(layout2Xml.includes("Second Layout"), "第2LayoutXMLのテキスト内容を含むこと");

                // 色属性の変換確認
                assert(layout2Xml.includes('color="R100G0B0"'), "色はR100G0B0形式に変換されること");
                assert(!layout2Xml.includes('color="rgb(1, 0, 0)"'), "元のrgb形式が残らないこと");
            });
        });

        describe("マイグレート後のStyleXMLの検証", () => {
            test("入力を反映して、StyleXMLが生成される", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "complex-xml-style");
                const inputFile = await prepareInputFile("test/fixtures/legacy_complex.xml", testCaseDir);
                const outputFile = join(testCaseDir, "output.yrt");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputFile
                ]);

                assert.strictEqual(result.exitCode, 0);

                const yrt = await readAndValidateNewFormatYrtFile(outputFile);
                const body = yrt[2];

                // StyleXMLの確認
                assert(body.s !== null, "StyleXMLを含むこと");
                assert(typeof body.s === "string", "StyleXMLは文字列であること");
                assert(body.s.includes("<Style"), "StyleXMLのルート要素は<Style>であること");
                assert(body.s.includes("style-1"), "StyleXMLはstyle-1 (連番key名) を含むこと");
            });
        });

        describe("警告の検証", () => {
            test("入力を反映して、警告が出力される", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "complex-xml-warning");
                const inputFile = await prepareInputFile("test/fixtures/legacy_complex.xml", testCaseDir);
                const result = await runYrtMigrate([inputFile]);

                assert.strictEqual(result.exitCode, 0);
                assert(result.stderr.includes("Image要素にwidth属性がありません"), "警告が出力されること");
            });
        });

        describe("マイグレート後のアセットの検証", () => {
            test("YRT入力の場合、アセットが正しく保持される", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "complex-yrt-assets");
                const inputFile = await prepareInputFile("test/fixtures/legacy_complex.yrt", testCaseDir, "input.yrt");
                const outputFile = join(testCaseDir, "output.yrt");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputFile
                ]);

                assert.strictEqual(result.exitCode, 0);

                const yrt = await readAndValidateNewFormatYrtFile(outputFile);
                const body = yrt[2];

                // アセットが保持されていることを確認
                assert.deepStrictEqual(
                    body.a,
                    {
                        image: await readFile("test/fixtures/image.png")
                    },
                    "入力されたYRTファイルのアセットが保持されること"
                );
            });

            test("XML入力の場合、アセットは含まれない", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "complex-xml-no-assets");
                const inputFile = await prepareInputFile("test/fixtures/legacy_complex.xml", testCaseDir);
                const outputFile = join(testCaseDir, "output.yrt");

                const result = await runYrtMigrate([
                    "--input", inputFile,
                    "--output", outputFile
                ]);

                assert.strictEqual(result.exitCode, 0);

                const yrt = await readAndValidateNewFormatYrtFile(outputFile);
                const body = yrt[2];

                assert.strictEqual(body.a, null, "XML入力の場合はアセットを含まないこと");
            });
        });

        describe("異なる入力形式に対するXML生成の一貫性の検証", () => {
            test("入力がYRT形式の場合も、入力がXML形式の場合と完全に同じXMLを生成する", async () => {
                const testCaseDir = await createTestCaseDir(testOutDir, "complex-xml-yrt-compare");

                // XML入力からの変換
                const inputFileLegacyXml = await prepareInputFile("test/fixtures/legacy_complex.xml", testCaseDir, "input.xml");
                const outputFileFromLegacyXml = join(testCaseDir, "from-xml.yrt");

                const xmlResult = await runYrtMigrate([
                    "--input", inputFileLegacyXml,
                    "--output", outputFileFromLegacyXml
                ]);
                assert.strictEqual(xmlResult.exitCode, 0);

                // YRT入力からの変換
                const yrtInputFile = await prepareInputFile("test/fixtures/legacy_complex.yrt", testCaseDir, "input.yrt");
                const yrtOutputFile = join(testCaseDir, "from-yrt.yrt");

                const yrtResult = await runYrtMigrate([
                    "--input", yrtInputFile,
                    "--output", yrtOutputFile
                ]);
                assert.strictEqual(yrtResult.exitCode, 0);

                // 結果の比較
                const yrtFromLegacyXml = await readAndValidateNewFormatYrtFile(outputFileFromLegacyXml);
                const yrtFromLegacyYrt = await readAndValidateNewFormatYrtFile(yrtOutputFile);

                const xmlBody = yrtFromLegacyXml[2];
                const yrtBody = yrtFromLegacyYrt[2];

                // 全XMLが同じであることを確認（アセットは除外）
                assert.deepStrictEqual(xmlBody.l, yrtBody.l, "LayoutXMLsの内容が完全に一致すること");
                assert.strictEqual(xmlBody.s, yrtBody.s, "StyleXMLの内容が完全に一致すること");
            });
        });
    });
});
