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

import * as path from "path";
import * as util from "util";
import { migrateFromAlpha13 } from "./migration_alpha13/index.js";
import { migrateFrom2025_1 } from "./migration_2025_1/index.js";

const SUPPORTED_FROM_VERSIONS = ["alpha13", "2025.1"];

/**
 * @param {unknown} error
 */
function printCliError(error) {
    if (error instanceof Error) {
        console.error(error.message);
    } else {
        console.error(error);
    }
}

function printHelp() {
    console.log(`Usage: npx yrt-migrate --from <schema_version> [options...] [input]

    -f, --from <schema_version> マイグレーション元のスキーマバージョンを指定します（必須）
    -o, --output <output_dir>  出力ディレクトリを指定します。省略時はバージョンに応じたデフォルトディレクトリを作成します
    -d, --dry-run              変換結果を表示します。ファイルへは出力されません
    --diagnostics <file>       警告メッセージを標準エラー出力ではなく指定したファイルへ書き出します
    -h, --help                 このメッセージを表示します

スキーマバージョン → SDKバージョンの対応表:
    alpha13    v1.0.0-alpha.13
    2025.1     v1.0
    2026.1     v2.0

マイグレーションパス:
    --from alpha13   alpha13 → 2025.1         入力: XMLファイル（<LayoutXml>ルート）
    --from 2025.1    2025.1 → 2026.1 (最新)   入力: ディレクトリまたはXMLファイル`);
}

async function main() {
    let args;
    try {
        args = util.parseArgs({
            options: {
                from: {
                    type: "string",
                    short: "f",
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
        console.error(`対応バージョン: ${SUPPORTED_FROM_VERSIONS.join(", ")}`);
        process.exitCode = 1;
        return;
    }
    if (!SUPPORTED_FROM_VERSIONS.includes(fromVersion)) {
        console.error(`未対応のスキーマバージョンです: ${fromVersion}`);
        console.error(`対応バージョン: ${SUPPORTED_FROM_VERSIONS.join(", ")}`);
        process.exitCode = 1;
        return;
    }

    let inputPath;
    if (args.positionals.length >= 1) {
        inputPath = args.positionals[0];
    } else {
        console.error("入力ファイルまたはディレクトリを指定してください");
        process.exitCode = 1;
        return;
    }
    inputPath = path.normalize(inputPath);

    const outputDir = args.values.output ?? null;

    try {
        if (fromVersion === "alpha13") {
            await migrateFromAlpha13(args, inputPath, outputDir);
        } else if (fromVersion === "2025.1") {
            await migrateFrom2025_1(args, inputPath, outputDir);
        }
    } catch (error) {
        printCliError(error);
        process.exitCode = 1;
    }
}

main();
