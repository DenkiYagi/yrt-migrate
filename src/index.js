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
import * as msgpack from "@msgpack/msgpack";
import * as util from "util";
import { documentToYrtBinary } from "./yrt_format.js";
import { formatXmlPretty, removeIndents } from "./formatter.mjs";
import { migrate as multipleXmls } from "./migrate/multiple_xmls.mjs";
import { migrate as orientationRename } from "./migrate/orientation_rename.mjs";
import { migrate as removeUnspecifiedAttr } from "./migrate/remove_unspecified_attr.mjs";
import { migrate as styleElementMigrate } from "./migrate/style_element.mjs";
import { migrate as removeContentElements } from "./migrate/remove_content_elements.mjs";
import { migrate as foreachHiddenToLogicMigrate } from "./migrate/foreach_hidden_to_logic.mjs";
import { migrate as removeDeprecatedLayoutAttrs } from "./migrate/remove_deprecated_layout_attrs.mjs";
import { migrate as addLayoutBody } from "./migrate/add_layout_body.mjs";
import { migrate as renameTableFrameElements } from "./migrate/rename_tableframe_elements.mjs";
import { migrate as warnImageWidthRequired } from "./migrate/warn_image_width_required.mjs";
import { migrate as renameAttrsMigrate } from "./migrate/rename_attrs.mjs";
import { migrate as mergeDirectionalAttrs } from "./migrate/merge_directional_attrs.mjs";
import { migrate as warnWidthAutoRange } from "./migrate/warn_width_auto_range.mjs";
import { migrate as colorNotationIllustrator } from "./migrate/color_notation_illustrator.mjs";
import { migrate as warnBindingRequired } from "./migrate/warn_binding_required.mjs";
import { migrate as warnSpanColorBinding } from "./migrate/warn_span_color_binding.mjs";
import { migrate as gridColsRowsRequired } from "./migrate/grid_cols_rows_required.mjs";
import { migrate as warnRectangleBorderRadiusMulti } from "./migrate/warn_rectangle_border_radius_multi.mjs";
import { migrate as sizeCommaToSpace } from "./migrate/size_comma_to_space.mjs";
import { migrate as borderstyleDasharrayToColon } from "./migrate/borderstyle_dasharray_to_colon.mjs";
import { migrate as warnBorderAdjacentLine } from "./migrate/warn_border_adjacent_line.mjs";
import { migrate as applySchema } from "./migrate/apply_schema.mjs";
import { validateXmlInput, validateYrtInput } from "./input_file_validator.mjs";

// XML整形出力を制御
const DO_FORMAT_XML = true;

/**
 * @param {import('./yrt_format.js').YrtOldDocument} yrtOldDocument
 * @returns {import('./yrt_format.js').YrtDocument}
 */
function migrate(yrtOldDocument) {
    const originalXml = yrtOldDocument.xml;
    let doc = multipleXmls(yrtOldDocument);
    doc = orientationRename(doc);
    doc = removeUnspecifiedAttr(doc);
    doc = styleElementMigrate(doc, originalXml);
    doc = removeContentElements(doc);
    doc = foreachHiddenToLogicMigrate(doc, originalXml);
    doc = removeDeprecatedLayoutAttrs(doc, originalXml);
    doc = addLayoutBody(doc, originalXml);
    doc = renameTableFrameElements(doc);
    doc = warnImageWidthRequired(doc, originalXml);
    doc = renameAttrsMigrate(doc);
    doc = mergeDirectionalAttrs(doc, originalXml);
    warnWidthAutoRange(doc, originalXml); // 警告のみ
    doc = colorNotationIllustrator(doc);
    warnBindingRequired(doc, originalXml); // 警告のみ
    warnSpanColorBinding(doc, originalXml); // 警告のみ
    doc = gridColsRowsRequired(doc);
    warnRectangleBorderRadiusMulti(doc, originalXml); // 警告のみ
    doc = sizeCommaToSpace(doc);
    doc = borderstyleDasharrayToColon(doc);
    warnBorderAdjacentLine(doc, originalXml); // 警告のみ

    // 最後にスキーマ指定用の属性追加
    doc = applySchema(doc);
    return doc;
}

function printHelp() {
    console.log(`Usage: npx yrt-migrate [options...] [input_file]
    -i, --input <input_file>   入力ファイル名を指定します。このオプションを使用した場合は末尾のファイル名は省略できます
    -o, --output <output_file> 出力ファイル名を指定します。省略した場合は入力ファイルを上書きします
    -b, --backup <backpu_file> バックアップファイル名を指定します。省略した場合は {input_file}.old を使用します
    -d, --dry-run              変換結果を表示します。ファイルへは出力されません
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
                backup: {
                    type: "string",
                    short: "b",
                },
                "dry-run": {
                    type: "boolean",
                    short: "d",
                },
                help: {
                    type: "boolean",
                    short: "h",
                },
            },
            allowPositionals: true,
        });
    } catch (error) {
        console.error(error);
        printHelp();
        process.exit(1);
    }

    if (args.values.help) {
        printHelp();
        process.exit(0);
    }

    let inputFileName;
    if (args.values.input) {
        inputFileName = args.values.input;
    } else if (args.positionals.length >= 1) {
        inputFileName = args.positionals[0];
    } else {
        console.error("入力ファイルを指定してください");
        process.exit(1);
    }

    const ext = path.extname(inputFileName);

    let backupFileName;
    if (args.values.backup) {
        backupFileName = args.values.backup;
    } else {
        backupFileName = `${inputFileName}.old`;
    }

    let outputFileName;
    if (args.values.output) {
        outputFileName = args.values.output;
    } else if (ext === ".xml") {
        outputFileName = inputFileName.replace(/\.xml$/i, ".yrt");
    } else {
        outputFileName = inputFileName;
    }

    try {
        let inputYrtDoc;
        if (ext === ".xml") {
            inputYrtDoc = await validateXmlInput(inputFileName);
        } else if (ext === ".yrt") {
            inputYrtDoc = await validateYrtInput(inputFileName);
        } else {
            console.error("非対応のファイル形式です");
            process.exit(1);
        }

        const migratedYrtDoc = migrate(inputYrtDoc);
        if (DO_FORMAT_XML) {
            migratedYrtDoc.layouts = migratedYrtDoc.layouts.map(layout => ({
                ...layout,
                xml: removeIndents(layout.xml)
            }));
            if (migratedYrtDoc.style) {
                migratedYrtDoc.style = formatXmlPretty(migratedYrtDoc.style);
            }
        }
        const migratedYrtBinary = documentToYrtBinary(migratedYrtDoc);
        const outputFile = msgpack.encode(migratedYrtBinary);

        if (args.values["dry-run"]) {
            migratedYrtDoc.layouts.forEach((layout, idx) => {
                console.log(`=== Layout ${idx} ===`);
                console.log(layout.xml);
            });
            if (migratedYrtDoc.style) {
                console.log("=== Style ===");
                console.log(migratedYrtDoc.style);
            }
        } else {
            // 入力が .yrt で出力ファイル名が同じ場合のみバックアップを作成
            if (ext === ".yrt" && outputFileName === inputFileName) {
                await fs.copyFile(inputFileName, backupFileName);
            }
            await fs.writeFile(outputFileName, outputFile);
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

main();
