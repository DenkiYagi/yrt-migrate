#!/usr/bin/env node

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
import { yrtRootToPackage, packageToYrtRoot } from "./yrt_format.js";
import { formatXmlPretty, removeIndents } from "./formatter.mjs";
import { migrate as layoutsToMultipleXmls } from "./multiple_xmls.mjs";
import { migrate as removeUnspecifiedAttr } from "./remove_unspecified_attr.mjs";
import { migrate as removeContentElements } from "./remove_content_elements.mjs";
import { migrate as styleElementMigrate } from "./style_element.mjs";
import { migrate as foreachHiddenToLogicMigrate } from "./foreach_hidden_to_logic.mjs";
import { migrate as removeDeprecatedLayoutAttrs } from "./remove_deprecated_layout_attrs.mjs";
import { migrate as addLayoutBody } from "./add_layout_body.mjs";
import { migrate as renameTableFrameElements } from "./rename_tableframe_elements.mjs";
import { migrate as imageWidthRequiredMigrate } from "./image_width_required.mjs";
import { migrate as renameAttrsMigrate } from "./rename_attrs.mjs";
import { migrate as mergeDirectionalAttrsMigrate } from "./merge_directional_attrs.mjs";
import { migrate as widthAutoRangeWarnMigrate } from "./width_auto_range_warn.mjs";
import { migrate as colorNotationIllustratorMigrate } from "./color_notation_illustrator.mjs";
import { migrate as bindingRequiredWarnMigrate } from "./binding_required_warn.mjs";
import { migrate as gridColsRowsRequiredWarnMigrate } from "./grid_cols_rows_required_warn.mjs";
import { migrate as rectangleBorderRadiusMultiWarnMigrate } from "./rectangle_border_radius_multi_warn.mjs";
import { migrate as sizeCommaToSpaceMigrate } from "./size_comma_to_space.mjs";
import { migrate as borderstyleDasharrayToColonMigrate } from "./borderstyle_dasharray_to_colon.mjs";
import { migrate as borderAdjacentLineWarning } from "./border_adjacent_line_warning.mjs";
import { migrate as warnSpanColorBinding } from "./span_color_binding_warn.mjs";
import { migrate as applySchema } from "./apply_schema.mjs";
import { validateXmlInput, validateYrtInput } from "./yrt_input_validator.mjs";

// XML整形出力を制御
const DO_FORMAT_XML = true;

function migrate(newYrtRoot) {
    newYrtRoot = layoutsToMultipleXmls(newYrtRoot);
    newYrtRoot = removeUnspecifiedAttr(newYrtRoot);
    newYrtRoot = styleElementMigrate(newYrtRoot);
    newYrtRoot = removeContentElements(newYrtRoot);
    newYrtRoot = foreachHiddenToLogicMigrate(newYrtRoot);
    newYrtRoot = removeDeprecatedLayoutAttrs(newYrtRoot);
    newYrtRoot = addLayoutBody(newYrtRoot);
    newYrtRoot = renameTableFrameElements(newYrtRoot);
    newYrtRoot = imageWidthRequiredMigrate(newYrtRoot);
    newYrtRoot = renameAttrsMigrate(newYrtRoot);
    newYrtRoot = mergeDirectionalAttrsMigrate(newYrtRoot);
    widthAutoRangeWarnMigrate(newYrtRoot); // 警告のみ
    newYrtRoot = colorNotationIllustratorMigrate(newYrtRoot);
    bindingRequiredWarnMigrate(newYrtRoot); // 警告のみ
    warnSpanColorBinding(newYrtRoot); // 警告のみ
    gridColsRowsRequiredWarnMigrate(newYrtRoot); // 警告のみ
    rectangleBorderRadiusMultiWarnMigrate(newYrtRoot); // 警告のみ
    newYrtRoot = sizeCommaToSpaceMigrate(newYrtRoot);
    newYrtRoot = borderstyleDasharrayToColonMigrate(newYrtRoot);
    borderAdjacentLineWarning(newYrtRoot); // 警告のみ

    // 最後にスキーマ指定用の属性追加
    newYrtRoot = applySchema(newYrtRoot);
    return newYrtRoot;
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
        let inputYrtRoot;
        if (ext === ".xml") {
            inputYrtRoot = await validateXmlInput(inputFileName);
        } else if (ext === ".yrt") {
            inputYrtRoot = await validateYrtInput(inputFileName);
        } else {
            console.error("非対応のファイル形式です");
            process.exit(1);
        }

        const migratedYrtRoot = migrate(inputYrtRoot);
        // LayoutXMLとStyleXMLを整形（それぞれ別の関数を使用することに注意）
        migratedYrtRoot[2].l = migratedYrtRoot[2].l.map(([name, xml]) => [name, DO_FORMAT_XML ? removeIndents(xml) : xml]);
        if (migratedYrtRoot[2].s) {
            migratedYrtRoot[2].s = DO_FORMAT_XML ? formatXmlPretty(migratedYrtRoot[2].s) : migratedYrtRoot[2].s;
        }
        const migratedPkg = yrtRootToPackage(migratedYrtRoot);
        const outputFile = msgpack.encode(migratedYrtRoot);

        if (args.values["dry-run"]) {
            migratedPkg.layouts.forEach((layout, idx) => {
                console.log(`=== Layout ${idx} ===`);
                console.log(layout.xml);
            });
            if (migratedPkg.style) {
                console.log("=== Style ===");
                console.log(migratedPkg.style);
            }
        } else {
            // 入力が .yrt で出力ファイル名が同じ場合のみバックアップを作成
            if (ext === ".yrt" && outputFileName === inputFileName) {
                await fs.copyFile(inputFileName, backupFileName);
            }
            await fs.writeFile(outputFileName, Buffer.from(outputFile));
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

main();
