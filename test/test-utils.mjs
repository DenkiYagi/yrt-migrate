// @ts-check

import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as msgpack from "@msgpack/msgpack";
import assert from "node:assert";

const CLI_ENTRY_POINT_FILE_PATH = "src/index.js";
const execFileAsync = promisify(execFile);

// テストケースごとに自動インクリメントするためのカウンタを保持
const testCaseDirCounters = new Map();

/**
 * `node index.js` を実行するヘルパー関数
 *
 * @param {string[]} args - CLI引数の配列
 * @param {import("node:child_process").ExecFileOptionsWithStringEncoding} options - 実行オプション
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
export async function runYrtMigrate(args = [], options = {}) {
    try {
        const { stdout, stderr } = await execFileAsync("node", [CLI_ENTRY_POINT_FILE_PATH, ...args], {
            cwd: path.resolve(process.cwd()),
            ...options,
        });
        return { stdout, stderr, exitCode: 0 };
    } catch (e) {
        /** @type {any} */
        const error = e;
        return {
            stdout: error.stdout || "",
            stderr: error.stderr || "",
            exitCode: error.code || 1
        };
    }
}

/**
 * 新YRT形式の構造を検証するヘルパー関数
 * @param {Buffer} data - YRTバイナリデータ
 * @returns {import("../src/yrt_format").YrtBinary} - デコード後のYRTデータオブジェクト
 */
export function decodeAndValidateNewFormatYrt(data) {
    const decoded = msgpack.decode(data);

    // YrtRoot形式の検証
    assert(Array.isArray(decoded), "YRT data should be an array");
    assert.strictEqual(decoded.length, 3, "YRT array should have 3 elements");
    assert.strictEqual(decoded[0], "YRT", "First element should be 'YRT'");
    assert.strictEqual(decoded[1], 1, "Second element should be version 1");
    assert.strictEqual(typeof decoded[2], "object", "Third element should be an object");

    const body = decoded[2];
    assert(body.hasOwnProperty("l"), "Body should have 'l' property");
    assert(Array.isArray(body.l), "Body.l should be an array");
    assert(body.l.length > 0, "Body.l should not be empty");

    // 各レイアウトエントリの検証
    body.l.forEach((/** @type {Array<any>} */ entry) => {
        const [name, xml] = entry;
        assert(name === null || typeof name === "string", "Layout name should be null or string");
        assert(typeof xml === "string", "Layout XML should be a string");
        assert(xml.length > 0, "Layout XML should not be empty");
    });

    // @ts-ignore
    return decoded;
}

/**
 * ファイルが存在するかどうかを確認するヘルパー関数
 * @param {string} filePath - 確認するファイルパス
 * @returns {Promise<boolean>} - ファイルが存在する場合true
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * テストケース用のディレクトリを作成するヘルパー関数（自動インクリメントprefix付き）
 * @param {string} testOutDir - 基本となるtest-outディレクトリパス
 * @param {string} testCaseName - テストケース名（prefix不要、関数が自動付与）
 * @returns {Promise<string>} - 作成されたディレクトリのパス
 */
export async function createTestCaseDir(testOutDir, testCaseName) {
    // カウンタ取得・更新
    let counter = testCaseDirCounters.get(testOutDir) || 1;
    const prefix = String(counter).padStart(2, "0");
    testCaseDirCounters.set(testOutDir, counter + 1);
    const dirName = `${prefix}-${testCaseName}`;
    const testCaseDir = path.join(testOutDir, dirName);
    await fs.mkdir(testCaseDir, { recursive: true });
    return testCaseDir;
}

/**
 * 入力ファイルをテスト用ディレクトリにコピーして新しいパスを返すヘルパー関数
 * @param {string} originalPath - 元ファイルのパス
 * @param {string} testCaseDir - テストケース用ディレクトリのパス
 * @param {string} [fileName] - 新しいファイル名（省略時は元ファイル名を使用）
 * @returns {Promise<string>} - コピー後のファイルパス
 */
export async function prepareInputFile(originalPath, testCaseDir, fileName) {
    const newFileName = fileName || path.basename(originalPath);
    const newFilePath = path.join(testCaseDir, newFileName);
    await fs.copyFile(originalPath, newFilePath);
    return newFilePath;
}

/**
 * 指定のディレクトリをクリーンアップして再作成するヘルパー関数
 * @param {string} testOutDir - 指定のディレクトリのパス
 */
export async function setupTestOutputDir(testOutDir) {
    if (!testOutDir.startsWith("test-out")) throw new Error("Invalid test output directory");

    await fs.rm(testOutDir, { recursive: true, force: true });
    await fs.mkdir(testOutDir, { recursive: true });
}

/**
 * マイグレート後のYRTファイルを読み込んでデコード・検証する
 * @param {string} filePath - YRTファイル（新形式）のパス
 * @returns {Promise<import("../src/yrt_format").YrtBinary>} - デコード後のYRTデータオブジェクト
 */
export async function readAndValidateNewFormatYrtFile(filePath) {
    const data = await fs.readFile(filePath);
    return decodeAndValidateNewFormatYrt(data);
}
