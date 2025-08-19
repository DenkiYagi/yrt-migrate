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

            // 出力形式の基本検証（詳細な内容検証は「YRT内容検証テスト」で実施）
            const yrtRoot = await readAndValidateNewFormatYrtFile(outputFile);
            const body = yrtRoot[2];

            // 基本的なYRT構造の確認のみ
            assert(Array.isArray(body.l), "LayoutXMLs配列が存在することを確認");
            assert(body.l.length > 0, "少なくとも1つのLayoutXMLが存在することを確認");
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

            // 出力形式の基本検証（詳細な内容検証は「YRT内容検証テスト」で実施）
            const yrtRoot = await readAndValidateNewFormatYrtFile(outputFile);
            const body = yrtRoot[2];

            // 基本的なYRT構造の確認のみ
            assert(Array.isArray(body.l), "LayoutXMLs配列が存在することを確認");
            assert(body.l.length > 0, "少なくとも1つのLayoutXMLが存在することを確認");
            assert(body.a, "アセットが存在することを確認");
            assert(body.a["image"], "画像アセットが存在することを確認");
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

    describe("マイグレート後のXMLの検証", () => {
        describe("例: 最小構成のXML", () => {
            describe("マイグレート後のLayoutXMLの検証", () => {
                test("入力を反映して、StackLayoutが1つだけ生成される", async () => {
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-01-minimal-xml");

                    const inputFile = path.resolve("test/fixtures/legacy_minimal.xml");
                    const outputFile = path.join(testCaseDir, "output.yrt");

                    const result = await runYrtMigrate([
                        "--input", inputFile,
                        "--output", outputFile
                    ]);

                    assert.strictEqual(result.exitCode, 0);

                    // YRT内容の詳細検証
                    const yrtRoot = await readAndValidateNewFormatYrtFile(outputFile);
                    const body = yrtRoot[2];

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

            describe("マイグレート後のStyleXMLの検証", { skip: true }, () => {
                // TODO: 現在のバグ - 最小XMLでもStyleXMLが生成されてしまう（後で修正予定）
                // 修正後にskipを削除して以下のテストを有効化する
                test("入力を反映して、StyleXMLは生成されない", async () => {
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-01-minimal-xml-style");

                    const inputFile = path.resolve("test/fixtures/legacy_minimal.xml");
                    const outputFile = path.join(testCaseDir, "output.yrt");

                    const result = await runYrtMigrate([
                        "--input", inputFile,
                        "--output", outputFile
                    ]);

                    assert.strictEqual(result.exitCode, 0);

                    const yrtRoot = await readAndValidateNewFormatYrtFile(outputFile);
                    const body = yrtRoot[2];

                    assert.strictEqual(body.s, null, "StyleXMLを含まないこと");
                });
            });

            describe("異なる入力形式に対する挙動一貫性の検証", () => {
                test("入力がYRT形式の場合も、入力がXML形式の場合と完全に同じXMLを生成する", async () => {
                    // XML入力からの変換
                    const xmlTestCaseDir = await createTestCaseDir(testOutDir, "content-01-minimal-xml-compare");
                    const xmlInputFile = path.resolve("test/fixtures/legacy_minimal.xml");
                    const xmlOutputFile = path.join(xmlTestCaseDir, "from-xml.yrt");

                    const xmlResult = await runYrtMigrate([
                        "--input", xmlInputFile,
                        "--output", xmlOutputFile
                    ]);
                    assert.strictEqual(xmlResult.exitCode, 0);

                    // YRT入力からの変換
                    const yrtTestCaseDir = await createTestCaseDir(testOutDir, "content-02-minimal-yrt-compare");
                    const originalYrtFile = path.resolve("test/fixtures/legacy_minimal.yrt");
                    const yrtInputFile = path.join(yrtTestCaseDir, "input.yrt");
                    await fs.copyFile(originalYrtFile, yrtInputFile);
                    const yrtOutputFile = path.join(yrtTestCaseDir, "from-yrt.yrt");

                    const yrtResult = await runYrtMigrate([
                        "--input", yrtInputFile,
                        "--output", yrtOutputFile
                    ]);
                    assert.strictEqual(yrtResult.exitCode, 0);

                    // 結果の比較
                    const xmlYrtRoot = await readAndValidateNewFormatYrtFile(xmlOutputFile);
                    const yrtYrtRoot = await readAndValidateNewFormatYrtFile(yrtOutputFile);

                    const xmlBody = xmlYrtRoot[2];
                    const yrtBody = yrtYrtRoot[2];

                    // 全XMLが同じであることを確認（アセットは除外）
                    assert.deepStrictEqual(xmlBody.l, yrtBody.l, "LayoutXMLsの内容が完全に一致すべき");
                    assert.strictEqual(xmlBody.s, yrtBody.s, "StyleXMLの内容が完全に一致すべき");
                });
            });
        });

        describe("例: 複雑な構成のYRT", () => {
            describe("マイグレート後のLayoutXMLの検証", () => {
                test("入力を反映して、2つのLayoutが生成され、属性値の変換も行われる", async () => {
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-03-complex-xml");

                    const inputFile = path.resolve("test/fixtures/legacy_complex.xml");
                    const outputFile = path.join(testCaseDir, "output.yrt");

                    const result = await runYrtMigrate([
                        "--input", inputFile,
                        "--output", outputFile
                    ]);

                    assert.strictEqual(result.exitCode, 0);

                    // YRT内容の詳細検証
                    const yrtRoot = await readAndValidateNewFormatYrtFile(outputFile);
                    const body = yrtRoot[2];

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
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-03-complex-xml-style");

                    const inputFile = path.resolve("test/fixtures/legacy_complex.xml");
                    const outputFile = path.join(testCaseDir, "output.yrt");

                    const result = await runYrtMigrate([
                        "--input", inputFile,
                        "--output", outputFile
                    ]);

                    assert.strictEqual(result.exitCode, 0);

                    const yrtRoot = await readAndValidateNewFormatYrtFile(outputFile);
                    const body = yrtRoot[2];

                    // StyleXMLの確認
                    assert(body.s !== null, "StyleXMLを含むこと");
                    assert(typeof body.s === "string", "StyleXMLは文字列であること");
                    assert(body.s.includes("<Style"), "StyleXMLのルート要素は<Style>であること");
                    assert(body.s.includes("styleelement-1"), "StyleXMLはstyleelement-1 (連番key名) を含むこと");
                });
            });

            describe("異なる入力形式に対する挙動一貫性の検証", () => {
                test("入力がYRT形式の場合も、入力がXML形式の場合と完全に同じXMLを生成する", async () => {
                    // XML入力からの変換
                    const xmlTestCaseDir = await createTestCaseDir(testOutDir, "content-03-complex-xml-compare");
                    const xmlInputFile = path.resolve("test/fixtures/legacy_complex.xml");
                    const xmlOutputFile = path.join(xmlTestCaseDir, "from-xml.yrt");

                    const xmlResult = await runYrtMigrate([
                        "--input", xmlInputFile,
                        "--output", xmlOutputFile
                    ]);
                    assert.strictEqual(xmlResult.exitCode, 0);

                    // YRT入力からの変換
                    const yrtTestCaseDir = await createTestCaseDir(testOutDir, "content-04-complex-yrt-compare");
                    const originalYrtFile = path.resolve("test/fixtures/legacy_complex.yrt");
                    const yrtInputFile = path.join(yrtTestCaseDir, "input.yrt");
                    await fs.copyFile(originalYrtFile, yrtInputFile);
                    const yrtOutputFile = path.join(yrtTestCaseDir, "from-yrt.yrt");

                    const yrtResult = await runYrtMigrate([
                        "--input", yrtInputFile,
                        "--output", yrtOutputFile
                    ]);
                    assert.strictEqual(yrtResult.exitCode, 0);

                    // 結果の比較
                    const xmlYrtRoot = await readAndValidateNewFormatYrtFile(xmlOutputFile);
                    const yrtYrtRoot = await readAndValidateNewFormatYrtFile(yrtOutputFile);

                    const xmlBody = xmlYrtRoot[2];
                    const yrtBody = yrtYrtRoot[2];

                    // 全XMLが同じであることを確認（アセットは除外）
                    assert.deepStrictEqual(xmlBody.l, yrtBody.l, "LayoutXMLsの内容が完全に一致すべき");
                    assert.strictEqual(xmlBody.s, yrtBody.s, "StyleXMLの内容が完全に一致すべき");
                });
            });
        });
    });
});
