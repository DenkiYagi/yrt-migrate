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
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as fs from 'fs/promises';
import * as direction_attribute from './direction_attribute.mjs';
import * as path from 'path';
import * as msgpack from '@msgpack/msgpack';
import * as util from 'util';

function migrate(inputLayoutXml) {
    const doc = new DOMParser().parseFromString(inputLayoutXml, 'text/xml');
    
    direction_attribute.migrate(doc);

    const outputLayoutXml = new XMLSerializer().serializeToString(doc);
    return outputLayoutXml;
}

function printHelp() {
    console.log(`Usage: npx yrt-migrate [options...] [input_file]
    -i, --input <input_file>   入力ファイル名を指定します。このオプションを使用した場合は末尾のファイル名は省略できます
    -o, --output <output_file> 出力ファイル名を指定します。省略した場合は入力ファイルを上書きします
    -b, --backup <backpu_file> バックアップファイル名を指定します。省略した場合は {input_file}.old を使用します
    -d, --dry-run              変換結果を表示します。ファイルへは出力されません
    -h, --help                 このメッセージを表示します`);
}

let args;
try {
    args = util.parseArgs({
        options: {
            "input": {
                type: "string",
                short: "i"
            },
            "output": {
                type: "string",
                short: "o"
            },
            "backup": {
                type: "string",
                short: "b"
            },
            "dry-run": {
                type: "boolean",
                short: "d"
            },
            "help": {
                type: "boolean",
                short: "h"
            }
        },
        allowPositionals: true,
    })
} catch(error) {
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
} else {
    outputFileName = inputFileName;
}

try {
    if (ext == ".xml") {
        const inputLayoutXml = await fs.readFile(inputFileName, 'utf-8');
        const outputLayoutXml = migrate(inputLayoutXml);

        if (args.values['dry-run']) {
            console.log(outputLayoutXml);
        } else {
            await fs.copyFile(inputFileName, backupFileName);
            await fs.writeFile(outputFileName, outputLayoutXml);
        }
    } else if (ext == ".yrt") {
        const inputFile = await fs.readFile(inputFileName);
        const yrtFile = msgpack.decode(inputFile);

        const inputLayoutXml = yrtFile[0]
        const outputLayoutXml = migrate(inputLayoutXml);

        yrtFile[0] = outputLayoutXml;
        const outputFile = msgpack.encode(yrtFile);

        if (args.values['dry-run']) {
            console.log(outputLayoutXml);
        } else {
            await fs.copyFile(inputFileName, backupFileName);
            await fs.writeFile(outputFileName, Buffer.from(outputFile));
        }
    } else {
        console.error("非対応のファイル形式です")
        process.exit(1);
    }
} catch (error) {
    console.error(error);
    process.exit(1);
}
