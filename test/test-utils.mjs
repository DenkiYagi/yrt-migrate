// @ts-check

import { execFile } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import assert from "node:assert";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const TEST_DIR = fileURLToPath(new URL(".", import.meta.url));
const PROJECT_ROOT = path.resolve(TEST_DIR, "..");
const TEST_OUT_ROOT = path.join(PROJECT_ROOT, "test-out");
const CLI_ENTRY_POINT_FILE_PATH = path.join(PROJECT_ROOT, "src/index.js");

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
 * migration エントリを直接実行し、console 出力を抑制しつつ結果を返す。
 * @param {(args: { values: Record<string, any> }, inputPath: string, outputDir: string | null) => Promise<void>} migrationFn
 * @param {{ inputPath: string, outputDir?: string | null, dryRun?: boolean, diagnostics?: string | null }} options
 * @returns {Promise<{ error: Error | null, logs: string[], warnings: string[], errors: string[] }>}
 */
export async function invokeMigration(migrationFn, options) {
    const {
        inputPath,
        outputDir = null,
        dryRun = false,
        diagnostics = null,
    } = options;
    /** @type {Record<string, any>} */
    const values = {};
    if (dryRun) {
        values["dry-run"] = true;
    }
    if (diagnostics) {
        values.diagnostics = diagnostics;
    }

    /** @type {string[]} */
    const logs = [];
    /** @type {string[]} */
    const warnings = [];
    /** @type {string[]} */
    const errors = [];

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    console.log = (...args) => {
        logs.push(args.map(arg => String(arg)).join(" "));
    };
    console.warn = (...args) => {
        warnings.push(args.map(arg => String(arg)).join(" "));
    };
    console.error = (...args) => {
        errors.push(args.map(arg => String(arg)).join(" "));
    };

    try {
        await migrationFn({ values }, inputPath, outputDir);
        return { error: null, logs, warnings, errors };
    } catch (error) {
        return {
            error: error instanceof Error ? error : new Error(String(error)),
            logs,
            warnings,
            errors,
        };
    } finally {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
    }
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
    const resolvedPath = path.isAbsolute(testOutDir) ? testOutDir : path.join(PROJECT_ROOT, testOutDir);
    const relativeToTestOutRoot = path.relative(TEST_OUT_ROOT, resolvedPath);
    if (relativeToTestOutRoot.startsWith("..") || path.isAbsolute(relativeToTestOutRoot)) {
        throw new Error("Invalid test output directory");
    }

    await fs.rm(resolvedPath, { recursive: true, force: true });
    await fs.mkdir(resolvedPath, { recursive: true });
    return resolvedPath;
}

/**
 * 指定ディレクトリから `layout-*.xml` をソートして読み込む。
 * @param {string} outputDir
 * @returns {Promise<string[]>} - 各LayoutXML文字列の配列
 */
export async function readMigratedLayoutXmls(outputDir) {
    const entries = await fs.readdir(outputDir, { withFileTypes: true });
    const layouts = entries
        .filter(entry => entry.isFile() && /^layout-\d+\.xml$/u.test(entry.name))
        .map(entry => ({
            name: entry.name,
            index: Number(entry.name.match(/^layout-(\d+)\.xml$/u)?.[1] ?? NaN)
        }))
        .filter(({ index }) => Number.isInteger(index))
        .sort((a, b) => a.index - b.index);
    assert(layouts.length > 0, "No layout XML files were generated.");
    const results = [];
    for (const layout of layouts) {
        const filePath = path.join(outputDir, layout.name);
        results.push(await fs.readFile(filePath, "utf8"));
    }
    return results;
}

/**
 * 指定ディレクトリから `style.xml` を読み込む。存在しなければ null を返す。
 * @param {string} outputDir
 * @returns {Promise<string|null>} - `style.xml` の内容、存在しなければ null
 */
export async function readMigratedStyleXml(outputDir) {
    const stylePath = path.join(outputDir, "style.xml");
    if (await fileExists(stylePath)) {
        return fs.readFile(stylePath, "utf8");
    }
    return null;
}
