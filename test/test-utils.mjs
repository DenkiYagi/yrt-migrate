import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as msgpack from "@msgpack/msgpack";
import assert from "node:assert";

const execFileAsync = promisify(execFile);

/**
 * CLI commandを実行するヘルパー関数
 * @param {string[]} args - CLI引数の配列
 * @param {Object} options - 実行オプション
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number}>}
 */
export async function runYrtMigrate(args = [], options = {}) {
    try {
        const { stdout, stderr } = await execFileAsync("node", ["index.js", ...args], {
            cwd: path.resolve(process.cwd()),
            ...options
        });
        return { stdout, stderr, exitCode: 0 };
    } catch (error) {
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
 * @returns {YrtRoot} - デコード済みのYRTルートデータ
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
    body.l.forEach(([name, xml]) => {
        assert(name === null || typeof name === "string", "Layout name should be null or string");
        assert(typeof xml === "string", "Layout XML should be a string");
        assert(xml.length > 0, "Layout XML should not be empty");
    });

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
 * テストケース用のディレクトリを作成するヘルパー関数
 * @param {string} testOutDir - 基本となるtest-outディレクトリパス
 * @param {string} testCaseName - テストケース名
 * @returns {Promise<string>} - 作成されたディレクトリのパス
 */
export async function createTestCaseDir(testOutDir, testCaseName) {
    const testCaseDir = path.join(testOutDir, testCaseName);
    await fs.mkdir(testCaseDir, { recursive: true });
    return testCaseDir;
}

/**
 * test-outディレクトリをクリーンアップして再作成するヘルパー関数
 * @param {string} testOutDir - test-outディレクトリのパス
 */
export async function setupTestOutputDir(testOutDir) {
    try {
        await fs.rm(testOutDir, { recursive: true, force: true });
    } catch (error) {
        // ディレクトリが存在しない場合は無視
    }
    await fs.mkdir(testOutDir, { recursive: true });
}

/**
 * マイグレート後のYRTファイルを読み込んでYrtRoot形式で返すヘルパー関数
 * @param {string} filePath - YRTファイル（新形式）のパス
 * @returns {Promise<YrtRoot>} - YRTルートオブジェクト
 */
export async function readAndValidateNewFormatYrtFile(filePath) {
    const data = await fs.readFile(filePath);
    return decodeAndValidateNewFormatYrt(data);
}
