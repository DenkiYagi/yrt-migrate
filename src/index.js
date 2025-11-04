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
import { migrate as multipleXmls } from "./migrate/multiple_xmls.mjs";
import { migrate as orientationRename } from "./migrate/orientation_rename.mjs";
import { migrate as removeUnspecifiedAttr } from "./migrate/remove_unspecified_attr.mjs";
import { migrate as warnStyleElementBinding } from "./migrate/warn_grid_like_style_element_binding.mjs";
import { migrate as styleElementMigrate } from "./migrate/style_element.mjs";
import { migrate as removeContentElements } from "./migrate/remove_content_elements.mjs";
import { migrate as warnForeachHidden } from "./migrate/warn_foreach_hidden.mjs";
import { migrate as foreachHiddenToLogicMigrate } from "./migrate/foreach_hidden_to_logic.mjs";
import { migrate as warnDeprecatedLayoutAttrs } from "./migrate/warn_deprecated_layout_attrs.mjs";
import { migrate as addLayoutBody } from "./migrate/add_layout_body.mjs";
import { migrate as renameTableFrameElements } from "./migrate/rename_tableframe_elements.mjs";
import { migrate as warnImageWidthRequired } from "./migrate/warn_image_width_required.mjs";
import { migrate as renameAttrsMigrate } from "./migrate/rename_attrs.mjs";
import { migrate as warnGridLikeBorderConflict } from "./migrate/warn_grid_like_border_conflict.mjs";
import { migrate as warnGridLikeStyleElementBorderConflict } from "./migrate/warn_grid_like_style_element_border_conflict.mjs";
import { migrate as mergeDirectionalAttrs } from "./migrate/merge_directional_attrs.mjs";
import { migrate as warnWidthAutoRange } from "./migrate/warn_width_auto_range.mjs";
import { migrate as colorNotationIllustrator } from "./migrate/color_notation_illustrator.mjs";
import { migrate as warnBindingRequired } from "./migrate/warn_binding_required.mjs";
import { migrate as warnSpanColorBinding } from "./migrate/warn_span_color_binding.mjs";
import { migrate as gridColsRowsRequired } from "./migrate/grid_cols_rows_required.mjs";
import { migrate as warnRectangleBorderRadiusMulti } from "./migrate/warn_rectangle_border_radius_multi.mjs";
import { migrate as sizeCommaToSpace } from "./migrate/size_comma_to_space.mjs";
import { migrate as borderstyleDasharrayToColon } from "./migrate/borderstyle_dasharray_to_colon.mjs";
import { migrate as warnLinearLayoutChildrenBorder } from "./migrate/warn_linear_layout_children_border.mjs";
import { migrate as applySchema } from "./migrate/apply_schema.mjs";
import { validateXmlInput } from "./input_file_validator.mjs";
import { createDiagnosticsBuffer, flushDiagnostics, formatDiagnostic } from "./diagnostics.mjs";

// XML整形出力を制御
const DO_FORMAT_XML = true;

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
    console.log(`Usage: npx yrt-migrate [options...] [input_file]
    -i, --input <input_file>   入力ファイル名を指定します。このオプションを使用した場合は末尾のファイル名は省略できます
    -o, --output <output_dir>  出力ディレクトリを指定します。省略した場合は入力ファイルと同じディレクトリに {input_file_without_ext}-v1.0 を作成します
    -d, --dry-run              変換結果を表示します。ファイルへは出力されません
    --diagnostics <file>       警告メッセージを標準エラー出力ではなく指定したファイルへ書き出します
    -h, --help                 このメッセージを表示します`);
}

async function main() {
    let args;
    try {
        args = util.parseArgs({
            options: {
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

    let inputFileName;
    if (args.values.input) {
        inputFileName = args.values.input;
    } else if (args.positionals.length >= 1) {
        inputFileName = args.positionals[0];
    } else {
        console.error("入力ファイルを指定してください");
        process.exitCode = 1;
        return;
    }
    inputFileName = path.normalize(inputFileName);

    const ext = path.extname(inputFileName);

    let outputDir;
    if (args.values.output) {
        outputDir = args.values.output;
    } else {
        const parsed = path.parse(inputFileName);
        const parentDir = parsed.dir === "" ? "." : parsed.dir;
        outputDir = path.join(parentDir, `${parsed.name}-v1.0`);
    }

    try {
        if (ext.toLowerCase() !== ".xml") {
            console.error("非対応のファイル形式です（*.xml のみ対応しています）");
            process.exitCode = 1;
            return;
        }

        const inputLegacyDoc = await validateXmlInput(inputFileName);

        const diagnosticsOutput = args.values.diagnostics;
        const diagnostics = createDiagnosticsBuffer(inputFileName);
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
            const emittedFiles = [];
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
            migratedDoc.layouts.forEach((layoutXml, idx) => {
                const targetPath = path.join(outputDir, `layout-${idx + 1}.xml`);
                writeOperations.push(fs.writeFile(targetPath, `${layoutXml}\n`, "utf8"));
                emittedFiles.push(targetPath);
            });
            if (typeof migratedDoc.style === "string" && migratedDoc.style.trim().length > 0) {
                const stylePath = path.join(outputDir, "style.xml");
                writeOperations.push(fs.writeFile(stylePath, `${migratedDoc.style}\n`, "utf8"));
                emittedFiles.push(stylePath);
            }
            await Promise.all(writeOperations);
            console.log("\n変換結果を出力しました:");
            emittedFiles.forEach(filePath => {
                console.log("+", filePath);
            });
        }
    } catch (error) {
        console.error("想定外のエラーが発生しました");
        console.error(error);
        process.exitCode = 1;
        return;
    }
}

main();
