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
        test("引数なしで実行すると入力ファイルの指定を促すエラーメッセージを表示", async () => {
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

    describe("XMLファイル入力のテスト", () => {
        test("位置引数でXMLファイルを指定すると、同じディレクトリに同名の.yrtファイルが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "01-xml-positional-only");

            // 入力ファイルをテスト用ディレクトリにコピー
            const originalFile = path.resolve("test/fixtures/legacy_minimal.xml");
            const inputFile = path.join(testCaseDir, "input.xml");
            await fs.copyFile(originalFile, inputFile);

            const result = await runYrtMigrate([inputFile]);

            assert.strictEqual(result.exitCode, 0);

            const expectedOutputFile = path.join(testCaseDir, "input.yrt");
            assert.strictEqual(await fileExists(expectedOutputFile), true, "同名の.yrtファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(expectedOutputFile);
        });

        test("位置引数でXMLファイルを指定し、-oで出力先を指定すると指定したパスに変換結果が作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "02-xml-positional-with-output");

            const inputFile = path.resolve("test/fixtures/legacy_minimal.xml");
            const outputFile = path.join(testCaseDir, "custom_output.yrt");

            const result = await runYrtMigrate([
                inputFile,
                "--output", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            assert.strictEqual(await fileExists(outputFile), true, "指定した出力ファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(outputFile);
        });

        test("-iでXMLファイルを指定し、出力先を省略すると入力ファイルと同じディレクトリに同名の.yrtファイルが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "04-xml-input-only");

            // 入力ファイルをテスト用ディレクトリにコピーして、そこで変換テストを行う
            const originalFile = path.resolve("test/fixtures/legacy_complex.xml");
            const inputFile = path.join(testCaseDir, "legacy_complex.xml");
            await fs.copyFile(originalFile, inputFile);

            const result = await runYrtMigrate([
                "--input", inputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            const expectedOutputFile = path.join(testCaseDir, "legacy_complex.yrt");
            assert.strictEqual(await fileExists(expectedOutputFile), true, "同名の.yrtファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(expectedOutputFile);
        });

        test("-iでXMLファイルを指定し、-oで出力先を指定すると指定したパスに変換結果が作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "03-xml-input-output-options");

            const inputFile = path.resolve("test/fixtures/legacy_complex.xml");
            const outputFile = path.join(testCaseDir, "converted.yrt");

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
            const inputFile = path.resolve("test/fixtures/legacy_minimal.xml");

            const result = await runYrtMigrate([
                "--dry-run",
                inputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            // 標準出力への変換結果の確認
            assert(result.stdout.includes("=== Layout 0 ==="), "Layout情報がヘッダーと共に出力されること");
            assert(result.stdout.includes("<StackLayout"), "変換後のLayoutXMLが出力されること");
            assert(!result.stdout.includes("<LayoutXml>"), "ラップする<LayoutXml>要素は出力されないこと");
        });
    });

    describe("YRTファイル入力のテスト", () => {
        test("位置引数でYRTファイルを指定すると、元ファイルが上書きされ自動バックアップが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "05-yrt-positional-only");

            // 入力ファイルをテスト用ディレクトリにコピー
            const originalFile = path.resolve("test/fixtures/legacy_complex.yrt");
            const inputFile = path.join(testCaseDir, "data.yrt");
            await fs.copyFile(originalFile, inputFile);

            // 元のファイル内容を記録
            const originalData = await fs.readFile(inputFile);

            const result = await runYrtMigrate([inputFile]);

            assert.strictEqual(result.exitCode, 0);

            // 元ファイルがインプレースで変換されていることを確認
            await readAndValidateNewFormatYrtFile(inputFile);

            // 自動バックアップファイルの存在確認
            const backupFile = path.join(testCaseDir, "data.yrt.old");
            assert.strictEqual(await fileExists(backupFile), true, "自動バックアップファイルが作成されること");

            // バックアップファイルが元のデータを保持していることを確認
            const backupData = await fs.readFile(backupFile);
            assert.deepStrictEqual(backupData, originalData, "バックアップファイルが元のデータを保持していること");
        });

        test("位置引数でYRTファイルを指定し、-oで出力先を指定すると指定したパスに変換結果が作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "06-yrt-positional-with-output");

            // 入力ファイルをテスト用ディレクトリにコピー
            const originalFile = path.resolve("test/fixtures/legacy_complex.yrt");
            const inputFile = path.join(testCaseDir, "input.yrt");
            await fs.copyFile(originalFile, inputFile);

            const outputFile = path.join(testCaseDir, "converted.yrt");

            const result = await runYrtMigrate([
                inputFile,
                "--output", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            assert.strictEqual(await fileExists(outputFile), true, "指定した出力ファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(outputFile);

            // 元の入力ファイルは変更されていないことを確認
            const originalData = await fs.readFile(path.resolve("test/fixtures/legacy_complex.yrt"));
            const inputData = await fs.readFile(inputFile);
            assert.deepStrictEqual(originalData, inputData, "元の入力ファイルは変更されないこと");
        });

        test("-iでYRTファイルを指定し、出力先を省略すると元ファイルが上書きされ自動バックアップが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "08-yrt-input-only");

            // 入力ファイルをテスト用ディレクトリにコピー
            const originalFile = path.resolve("test/fixtures/legacy_complex.yrt");
            const inputFile = path.join(testCaseDir, "data.yrt");
            await fs.copyFile(originalFile, inputFile);

            // 元のファイル内容を記録
            const originalData = await fs.readFile(inputFile);

            const result = await runYrtMigrate([
                "--input", inputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            // 元ファイルがインプレースで変換されていることを確認
            await readAndValidateNewFormatYrtFile(inputFile);

            // 自動バックアップファイルの存在確認
            const backupFile = path.join(testCaseDir, "data.yrt.old");
            assert.strictEqual(await fileExists(backupFile), true, "自動バックアップファイルが作成されること");

            // バックアップファイルが元のデータを保持していることを確認
            const backupData = await fs.readFile(backupFile);
            assert.deepStrictEqual(backupData, originalData, "バックアップファイルが元のデータを保持していること");
        });

        test("-iでYRTファイルを指定し、-oで出力先を指定すると指定したパスに変換結果が作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "07-yrt-input-output-options");

            // 入力ファイルをテスト用ディレクトリにコピー
            const originalFile = path.resolve("test/fixtures/legacy_complex.yrt");
            const inputFile = path.join(testCaseDir, "input.yrt");
            await fs.copyFile(originalFile, inputFile);

            const outputFile = path.join(testCaseDir, "converted.yrt");

            const result = await runYrtMigrate([
                "--input", inputFile,
                "--output", outputFile
            ]);

            assert.strictEqual(result.exitCode, 0);

            assert.strictEqual(await fileExists(outputFile), true, "指定した出力ファイルが作成されること");

            // 出力結果の形式検証
            await readAndValidateNewFormatYrtFile(outputFile);

            // 元の入力ファイルは変更されていないことを確認
            const originalData = await fs.readFile(originalFile);
            const inputData = await fs.readFile(inputFile);
            assert.deepStrictEqual(originalData, inputData, "元の入力ファイルは変更されないこと");
        });

        test("-iでYRTファイルを指定し、-bで明示的にバックアップ先を指定すると元ファイルが上書きされ指定したバックアップが作成される", async () => {
            const testCaseDir = await createTestCaseDir(testOutDir, "09-yrt-input-with-backup");

            // 入力ファイルをテスト用ディレクトリにコピー
            const originalFile = path.resolve("test/fixtures/legacy_complex.yrt");
            const inputFile = path.join(testCaseDir, "input.yrt");
            await fs.copyFile(originalFile, inputFile);

            // 元のファイル内容を記録
            const originalData = await fs.readFile(inputFile);

            const backupFile = path.join(testCaseDir, "custom_backup.yrt");

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
            const backupData = await fs.readFile(backupFile);
            assert.deepStrictEqual(backupData, originalData, "バックアップファイルが元のデータを保持していること");
        });

        test("--dry-runオプションでYRTファイルを指定すると、ファイル出力せずに標準出力に変換結果が表示される", async () => {
            const inputFile = path.resolve("test/fixtures/legacy_complex.yrt");

            const result = await runYrtMigrate([
                "--input", inputFile,
                "--dry-run"
            ]);

            // 警告があっても正常終了することを確認（警告は stderr に出力される）
            assert.strictEqual(result.exitCode, 0);

            // 標準出力への変換結果の確認
            assert(result.stdout.includes("=== Layout 0 ==="), "Layout情報がヘッダーと共に出力されること");
            assert(result.stdout.includes("<LinearLayout"), "変換後のLayoutXMLが出力されること");
            assert(!result.stdout.includes("<LayoutXml>"), "ラップする<LayoutXml>要素は出力されないこと");
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

    describe("マイグレート結果の内容の検証", () => {
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

                    const yrt = await readAndValidateNewFormatYrtFile(outputFile);
                    const body = yrt[2];

                    assert.strictEqual(body.s, null, "StyleXMLを含まないこと");
                });
            });

            describe("マイグレート後のアセットの検証", () => {
                test("YRT入力の場合、アセットが正しく保持される", async () => {
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-01-minimal-yrt-assets");

                    // 入力ファイルをテスト用ディレクトリにコピー
                    const originalFile = path.resolve("test/fixtures/legacy_minimal.yrt");
                    const inputFile = path.join(testCaseDir, "input.yrt");
                    await fs.copyFile(originalFile, inputFile);

                    const outputFile = path.join(testCaseDir, "output.yrt");

                    const result = await runYrtMigrate([
                        "--input", inputFile,
                        "--output", outputFile
                    ]);

                    assert.strictEqual(result.exitCode, 0);

                    const yrt = await readAndValidateNewFormatYrtFile(outputFile);

                    assert.strictEqual(yrt[2].a, null, "入力されたYRTと同様、アセットを含まないこと");
                });

                test("XML入力の場合、アセットは含まれない", async () => {
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-01-minimal-xml-assets");

                    const inputFile = path.resolve("test/fixtures/legacy_minimal.xml");
                    const outputFile = path.join(testCaseDir, "output.yrt");

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
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-01-minimal-xml-yrt-compare");

                    // XML入力からの変換
                    const inputFileLegacyXml = path.resolve("test/fixtures/legacy_minimal.xml");
                    const outputFileFromLegacyXml = path.join(testCaseDir, "from-xml.yrt");

                    const resultFromLegacyXml = await runYrtMigrate([
                        "--input", inputFileLegacyXml,
                        "--output", outputFileFromLegacyXml
                    ]);
                    assert.strictEqual(resultFromLegacyXml.exitCode, 0);

                    // YRT入力からの変換
                    const originalYrtFile = path.resolve("test/fixtures/legacy_minimal.yrt");
                    const inputFileLegacyYrt = path.join(testCaseDir, "input.yrt");
                    await fs.copyFile(originalYrtFile, inputFileLegacyYrt);
                    const outputFileFromLegacyYrt = path.join(testCaseDir, "from-yrt.yrt");

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
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-03-complex-xml-style");

                    const inputFile = path.resolve("test/fixtures/legacy_complex.xml");
                    const outputFile = path.join(testCaseDir, "output.yrt");

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
                    assert(body.s.includes("styleelement-1"), "StyleXMLはstyleelement-1 (連番key名) を含むこと");
                });
            });

            describe("マイグレート後のアセットの検証", () => {
                test("YRT入力の場合、アセットが正しく保持される", async () => {
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-03-complex-yrt-assets");

                    // 入力ファイルをテスト用ディレクトリにコピー
                    const originalFile = path.resolve("test/fixtures/legacy_complex.yrt");
                    const inputFile = path.join(testCaseDir, "input.yrt");
                    await fs.copyFile(originalFile, inputFile);

                    const outputFile = path.join(testCaseDir, "output.yrt");

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
                            image: await fs.readFile("test/fixtures/image.png")
                        },
                        "入力されたYRTファイルのアセットが保持されること"
                    );
                });

                test("XML入力の場合、アセットは含まれない", async () => {
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-03-complex-xml-no-assets");

                    const inputFile = path.resolve("test/fixtures/legacy_complex.xml");
                    const outputFile = path.join(testCaseDir, "output.yrt");

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
                    const testCaseDir = await createTestCaseDir(testOutDir, "content-03-complex-xml-yrt-compare");

                    // XML入力からの変換
                    const inputFileLegacyXml = path.resolve("test/fixtures/legacy_complex.xml");
                    const outputFileFromLegacyXml = path.join(testCaseDir, "from-xml.yrt");

                    const xmlResult = await runYrtMigrate([
                        "--input", inputFileLegacyXml,
                        "--output", outputFileFromLegacyXml
                    ]);
                    assert.strictEqual(xmlResult.exitCode, 0);

                    // YRT入力からの変換
                    const originalYrtFile = path.resolve("test/fixtures/legacy_complex.yrt");
                    const yrtInputFile = path.join(testCaseDir, "input.yrt");
                    await fs.copyFile(originalYrtFile, yrtInputFile);
                    const yrtOutputFile = path.join(testCaseDir, "from-yrt.yrt");

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
});
