#!/usr/bin/env node

// @ts-check

/**
 * Copyright 2023 DenkiYagi Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as util from "util";
import { DOMParser } from "@xmldom/xmldom";
import { formatXmlPretty, removeIndents } from "./formatter.mjs";
import { migrate as multipleXmls } from "./migration_alpha13/multiple_xmls.mjs";
import { migrate as orientationRename } from "./migration_alpha13/orientation_rename.mjs";
import { migrate as removeUnspecifiedAttr } from "./migration_alpha13/remove_unspecified_attr.mjs";
import { migrate as warnStyleElementBinding } from "./migration_alpha13/warn_grid_like_style_element_binding.mjs";
import { migrate as styleElementMigrate } from "./migration_alpha13/style_element.mjs";
import { migrate as removeContentElements } from "./migration_alpha13/remove_content_elements.mjs";
import { migrate as warnForeachHidden } from "./migration_alpha13/warn_foreach_hidden.mjs";
import { migrate as foreachHiddenToLogicMigrate } from "./migration_alpha13/foreach_hidden_to_logic.mjs";
import { migrate as warnDeprecatedLayoutAttrs } from "./migration_alpha13/warn_deprecated_layout_attrs.mjs";
import { migrate as addLayoutBody } from "./migration_alpha13/add_layout_body.mjs";
import { migrate as renameTableFrameElements } from "./migration_alpha13/rename_tableframe_elements.mjs";
import { migrate as warnImageWidthRequired } from "./migration_alpha13/warn_image_width_required.mjs";
import { migrate as renameAttrsMigrate } from "./migration_alpha13/rename_attrs.mjs";
import { migrate as warnGridLikeBorderConflict } from "./migration_alpha13/warn_grid_like_border_conflict.mjs";
import { migrate as warnGridLikeStyleElementBorderConflict } from "./migration_alpha13/warn_grid_like_style_element_border_conflict.mjs";
import { migrate as mergeDirectionalAttrs } from "./migration_alpha13/merge_directional_attrs.mjs";
import { migrate as warnWidthAutoRange } from "./migration_alpha13/warn_width_auto_range.mjs";
import { migrate as colorNotationIllustrator } from "./migration_alpha13/color_notation_illustrator.mjs";
import { migrate as warnBindingRequired } from "./migration_alpha13/warn_binding_required.mjs";
import { migrate as warnSpanColorBinding } from "./migration_alpha13/warn_span_color_binding.mjs";
import { migrate as gridColsRowsRequired } from "./migration_alpha13/grid_cols_rows_required.mjs";
import { migrate as warnRectangleBorderRadiusMulti } from "./migration_alpha13/warn_rectangle_border_radius_multi.mjs";
import { migrate as sizeCommaToSpace } from "./migration_alpha13/size_comma_to_space.mjs";
import { migrate as borderstyleDasharrayToColon } from "./migration_alpha13/borderstyle_dasharray_to_colon.mjs";
import { migrate as warnLinearLayoutChildrenBorder } from "./migration_alpha13/warn_linear_layout_children_border.mjs";
import { migrate as applySchema } from "./migration_alpha13/apply_schema.mjs";
import { validateXmlInput } from "./input_file_validator.mjs";
import { createDiagnosticsBuffer, flushDiagnostics, formatDiagnostic } from "./diagnostics.mjs";
import { detectXmlType, migrateTo2026_1 } from "./migration_2025_1/migrate_2026_1.mjs";

// XML整形出力を制御
const DO_FORMAT_XML = true;

const SUPPORTED_FROM_VERSIONS = ['alpha13', '2025.1'];

/**
 * @param {import('./yrt_format.js').LegacyLayoutDocument} legacyDocument
 * @param {import('./diagnostics.mjs').DiagnosticsBuffer} diagnostics
 * @returns {import('./yrt_format.js').MigratedXmlCollection}
 */
function migrate(legacyDocument, diagnostics) {
    const originalXml = legacyDocument.xml;
    const originalDocument = new DOMParser().parseFromString(originalXml, "text/xml");

    // 警告系
    warnStyleElementBinding(diagnostics, originalDocument, originalXml);
    warnForeachHidden(diagnostics, originalDocument, originalXml);
    warnDeprecatedLayoutAttrs(diagnostics, originalDocument, originalXml);
    warnImageWidthRequired(diagnostics, originalDocument, originalXml);
    warnGridLikeBorderConflict(diagnostics, originalDocument, originalXml);
    warnGridLikeStyleElementBorderConflict(diagnostics, originalDocument, originalXml);
    warnWidthAutoRange(diagnostics, originalDocument, originalXml);
    warnBindingRequired(diagnostics, originalDocument, originalXml);
    warnSpanColorBinding(diagnostics, originalDocument, originalXml);
    warnRectangleBorderRadiusMulti(diagnostics, originalDocument, originalXml);
    warnLinearLayoutChildrenBorder(diagnostics, originalDocument, originalXml);

    // 変換系
    let doc = multipleXmls(legacyDocument);
    doc = orientationRename(doc);
    doc = removeUnspecifiedAttr(doc);
    doc = styleElementMigrate(doc);
    doc = removeContentElements(doc);
    doc = foreachHiddenToLogicMigrate(doc);
    doc = addLayoutBody(doc);
    doc = renameTableFrameElements(doc);
    doc = renameAttrsMigrate(doc);
    doc = mergeDirectionalAttrs(doc);
    doc = colorNotationIllustrator(doc);
    doc = gridColsRowsRequired(doc);
    doc = sizeCommaToSpace(doc);
    doc = borderstyleDasharrayToColon(doc);
    doc = applySchema(doc);

    return doc;
}

function printHelp() {
    console.log(`Usage: npx yrt-migrate --from <schema_version> [options...] [input]

    --from <schema_version>    マイグレーション元のスキーマバージョンを指定します（必須）
    -i, --input <input>        入力ファイルまたはディレクトリを指定します。このオプションを使用した場合は末尾の入力は省略できます
    -o, --output <output_dir>  出力ディレクトリを指定します。省略時はバージョンに応じたデフォルトディレクトリを作成します
    -d, --dry-run              変換結果を表示します。ファイルへは出力されません
    --diagnostics <file>       警告メッセージを標準エラー出力ではなく指定したファイルへ書き出します
    -h, --help                 このメッセージを表示します

スキーマバージョン → SDKバージョンの対応表:
    alpha13    v1.0.0-alpha.13
    2025.1     v1.0
    2026.1     v2.0

マイグレーションパス:
    --from alpha13   alpha13 → v1.0（スキーマ 2025.1）  入力: XMLファイル（<LayoutXml>ルート）
    --from 2025.1    v1.0 → v2.0（スキーマ 2026.1）     入力: ディレクトリまたはXMLファイル`);
}

/**
 * alpha13→v1.0マイグレーションの出力ディレクトリデフォルト名を決定する
 * @param {string} inputFileName 入力ファイルパス
 * @returns {string} 出力ディレクトリパス
 */
function getDefaultOutputDirAlpha13(inputFileName) {
    const parsed = path.parse(inputFileName);
    const parentDir = parsed.dir === "" ? "." : parsed.dir;
    return path.join(parentDir, `${parsed.name}-v1.0`);
}

/**
 * v1.0→v2.0マイグレーションの出力ディレクトリデフォルト名を決定する
 * -v1.0サフィックスがあれば除去してから-v2.0を付与する
 * @param {string} inputPath 入力パス（ディレクトリまたはファイル）
 * @param {boolean} isDirectory 入力がディレクトリかどうか
 * @returns {string} 出力ディレクトリパス
 */
function getDefaultOutputDirV2(inputPath, isDirectory) {
    if (isDirectory) {
        // 末尾の / を除去してからベース名を取得
        const normalized = inputPath.replace(/[/\\]+$/u, "");
        const parentDir = path.dirname(normalized);
        const dirName = path.basename(normalized);
        const baseName = dirName.replace(/-v1\.0$/u, "");
        return path.join(parentDir, `${baseName}-v2.0`);
    } else {
        const fileDir = path.dirname(inputPath);
        const parentDir = path.dirname(fileDir);
        const dirName = path.basename(fileDir);
        const baseName = dirName.replace(/-v1\.0$/u, "");
        return path.join(parentDir, `${baseName}-v2.0`);
    }
}

/**
 * ディレクトリ内の全XMLファイルを読み込む
 * @param {string} dirPath ディレクトリパス
 * @returns {Promise<Array<{ fileName: string, xml: string, type: 'layout' | 'style' }>>}
 */
async function readV1Directory(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const xmlFiles = entries
        .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === ".xml")
        .map(entry => entry.name)
        .sort();

    /** @type {Array<{ fileName: string, xml: string, type: 'layout' | 'style' }>} */
    const results = [];
    for (const fileName of xmlFiles) {
        const filePath = path.join(dirPath, fileName);
        const xml = await fs.readFile(filePath, "utf-8");
        const type = detectXmlType(xml);
        results.push({ fileName, xml, type });
    }
    return results;
}

/**
 * 出力ディレクトリにファイルを書き出す共通処理
 * @param {string} outputDir 出力ディレクトリ
 * @param {Array<{ fileName: string, content: string }>} files 出力ファイル一覧
 */
async function writeOutputFiles(outputDir, files) {
    try {
        await fs.mkdir(outputDir, { recursive: true });
    } catch (dirError) {
        console.error("出力先ディレクトリーの作成に失敗しました");
        console.error(dirError);
        process.exitCode = 1;
        return;
    }
    try {
        const existingEntries = await fs.readdir(outputDir, { withFileTypes: true });
        const cleanupTargets = existingEntries
            .filter(entry => entry.isFile() && (/^layout-\d+\.xml$/u.test(entry.name) || entry.name === "style.xml"))
            .map(entry => path.join(outputDir, entry.name));
        await Promise.all(cleanupTargets.map(targetPath => fs.rm(targetPath, { force: true })));
    } catch (cleanupError) {
        console.error("既存の出力ファイルの削除に失敗しました");
        console.error(cleanupError);
        process.exitCode = 1;
        return;
    }
    const writeOperations = [];
    const emittedFiles = [];
    for (const file of files) {
        const targetPath = path.join(outputDir, file.fileName);
        writeOperations.push(fs.writeFile(targetPath, `${file.content}\n`, "utf8"));
        emittedFiles.push(targetPath);
    }
    await Promise.all(writeOperations);
    console.log("\n変換結果を出力しました:");
    emittedFiles.forEach(filePath => {
        console.log("+", filePath);
    });
}

/**
 * alpha13→v1.0マイグレーション処理
 */
async function mainAlpha13(args, inputPath, outputDir) {
    const ext = path.extname(inputPath);
    if (ext.toLowerCase() !== ".xml") {
        console.error("非対応のファイル形式です（*.xml のみ対応しています）");
        process.exitCode = 1;
        return;
    }

    let inputLegacyDoc;
    try {
        inputLegacyDoc = await validateXmlInput(inputPath);
    } catch (validationError) {
        console.error("入力ファイルの検証に失敗しました:");
        if (validationError instanceof Error) console.error(validationError.message);
        else console.error(validationError);
        process.exitCode = 1;
        return;
    }

    const diagnosticsOutput = args.values.diagnostics;
    const diagnostics = createDiagnosticsBuffer(inputPath);
    let migratedDoc = migrate(inputLegacyDoc, diagnostics);
    if (diagnosticsOutput) {
        const formatted = diagnostics.items.map(d => formatDiagnostic(d, diagnostics.sourcePath)).join("\n");
        await fs.writeFile(diagnosticsOutput, formatted.length > 0 ? `${formatted}\n` : "");
    } else {
        flushDiagnostics(diagnostics);
    }
    if (DO_FORMAT_XML) {
        const formattedLayouts = migratedDoc.layouts.map(layoutXml => removeIndents(layoutXml));
        let formattedStyle = migratedDoc.style ?? null;
        if (typeof formattedStyle === "string" && formattedStyle.trim().length > 0) {
            formattedStyle = formatXmlPretty(formattedStyle);
        }
        migratedDoc = {
            layouts: formattedLayouts,
            style: formattedStyle,
        };
    }

    if (args.values["dry-run"]) {
        migratedDoc.layouts.forEach((layoutXml, idx) => {
            console.log(`=== Layout ${idx + 1} ===`);
            console.log(layoutXml);
        });
        if (typeof migratedDoc.style === "string" && migratedDoc.style.trim().length > 0) {
            console.log("=== Style ===");
            console.log(migratedDoc.style);
        }
    } else {
        /** @type {Array<{ fileName: string, content: string }>} */
        const files = [];
        migratedDoc.layouts.forEach((layoutXml, idx) => {
            files.push({ fileName: `layout-${idx + 1}.xml`, content: layoutXml });
        });
        if (typeof migratedDoc.style === "string" && migratedDoc.style.trim().length > 0) {
            files.push({ fileName: "style.xml", content: migratedDoc.style });
        }
        await writeOutputFiles(outputDir, files);
    }
}

/**
 * v1.0→v2.0マイグレーション処理
 */
async function mainV2(args, inputPath, outputDir) {
    let isDirectory = false;
    try {
        const stat = await fs.stat(inputPath);
        isDirectory = stat.isDirectory();
    } catch {
        console.error(`入力パスが見つかりません: ${inputPath}`);
        process.exitCode = 1;
        return;
    }

    /** @type {Array<{ fileName: string, xml: string, type: 'layout' | 'style' }>} */
    let inputFiles;

    if (isDirectory) {
        try {
            inputFiles = await readV1Directory(inputPath);
        } catch (readError) {
            console.error("入力ディレクトリの読み込みに失敗しました:");
            if (readError instanceof Error) console.error(readError.message);
            else console.error(readError);
            process.exitCode = 1;
            return;
        }
        if (inputFiles.length === 0) {
            console.error("入力ディレクトリにXMLファイルが見つかりません");
            process.exitCode = 1;
            return;
        }
    } else {
        const ext = path.extname(inputPath);
        if (ext.toLowerCase() !== ".xml") {
            console.error("非対応のファイル形式です（*.xml のみ対応しています）");
            process.exitCode = 1;
            return;
        }
        try {
            const xml = await fs.readFile(inputPath, "utf-8");
            const type = detectXmlType(xml);
            inputFiles = [{ fileName: path.basename(inputPath), xml, type }];
        } catch (readError) {
            console.error("入力ファイルの読み込みに失敗しました:");
            if (readError instanceof Error) console.error(readError.message);
            else console.error(readError);
            process.exitCode = 1;
            return;
        }
    }

    // マイグレーション実行
    /** @type {Array<{ fileName: string, content: string }>} */
    const migratedFiles = [];
    for (const file of inputFiles) {
        const migrated = migrateTo2026_1(file.xml, file.type);
        migratedFiles.push({ fileName: file.fileName, content: migrated });
    }

    if (!outputDir) {
        outputDir = getDefaultOutputDirV2(inputPath, isDirectory);
    }

    if (args.values["dry-run"]) {
        for (const file of migratedFiles) {
            console.log(`=== ${file.fileName} ===`);
            console.log(file.content);
        }
    } else {
        await writeOutputFiles(outputDir, migratedFiles);
    }
}

async function main() {
    let args;
    try {
        args = util.parseArgs({
            options: {
                from: {
                    type: "string",
                },
                input: {
                    type: "string",
                    short: "i",
                },
                output: {
                    type: "string",
                    short: "o",
                },
                "dry-run": {
                    type: "boolean",
                    short: "d",
                },
                help: {
                    type: "boolean",
                    short: "h",
                },
                diagnostics: {
                    type: "string",
                },
            },
            allowPositionals: true,
        });
    } catch (error) {
        console.error(error);
        printHelp();
        process.exitCode = 1;
        return;
    }

    if (args.values.help) {
        printHelp();
        process.exitCode = 0;
        return;
    }

    const fromVersion = args.values.from;
    if (!fromVersion) {
        console.error("--from オプションでマイグレーション元のスキーマバージョンを指定してください");
        console.error(`対応バージョン: ${SUPPORTED_FROM_VERSIONS.join(', ')}`);
        process.exitCode = 1;
        return;
    }
    if (!SUPPORTED_FROM_VERSIONS.includes(fromVersion)) {
        console.error(`未対応のスキーマバージョンです: ${fromVersion}`);
        console.error(`対応バージョン: ${SUPPORTED_FROM_VERSIONS.join(', ')}`);
        process.exitCode = 1;
        return;
    }

    let inputPath;
    if (args.values.input) {
        inputPath = args.values.input;
    } else if (args.positionals.length >= 1) {
        inputPath = args.positionals[0];
    } else {
        console.error("入力ファイルまたはディレクトリを指定してください");
        process.exitCode = 1;
        return;
    }
    inputPath = path.normalize(inputPath);

    const outputDir = args.values.output;

    try {
        if (fromVersion === 'alpha13') {
            const resolvedOutputDir = outputDir ?? getDefaultOutputDirAlpha13(inputPath);
            await mainAlpha13(args, inputPath, resolvedOutputDir);
        } else if (fromVersion === '2025.1') {
            await mainV2(args, inputPath, outputDir ?? null);
        }
    } catch (error) {
        console.error("想定外のエラーが発生しました");
        console.error(error);
        process.exitCode = 1;
        return;
    }
}

main();
