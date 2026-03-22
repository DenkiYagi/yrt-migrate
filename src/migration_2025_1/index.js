// @ts-check

import * as fs from "fs/promises";
import * as path from "path";
import { detectXmlType, migrateTo2026_1 } from "./migrate_2026_1.mjs";

/**
 * @param {string} prefix
 * @param {unknown} [error]
 * @returns {Error}
 */
function createContextualError(prefix, error) {
    if (error instanceof Error && error.message.length > 0) {
        return new Error(`${prefix}: ${error.message}`);
    }
    if (typeof error === "string" && error.length > 0) {
        return new Error(`${prefix}: ${error}`);
    }
    return new Error(prefix);
}

/**
 * @param {string} inputPath
 * @param {boolean} isDirectory
 * @returns {string}
 */
function getDefaultOutputDir(inputPath, isDirectory) {
    if (isDirectory) {
        const normalized = inputPath.replace(/[/\\]+$/u, "");
        const parentDir = path.dirname(normalized);
        const dirName = path.basename(normalized);
        const baseName = dirName.replace(/-v1\.0$/u, "");
        return path.join(parentDir, `${baseName}-2026.1`);
    }

    const parsed = path.parse(inputPath);
    if (parsed.dir === "" || parsed.dir === ".") {
        return path.join(".", `${parsed.name}-2026.1`);
    }

    const parentDir = path.dirname(parsed.dir);
    const dirName = path.basename(parsed.dir);
    const baseName = dirName.replace(/-v1\.0$/u, "");
    return path.join(parentDir, `${baseName}-2026.1`);
}

/**
 * @param {string} dirPath
 * @returns {Promise<Array<{ fileName: string, xml: string, type: "layout" | "style" }>>}
 */
async function readInputDirectory(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const xmlFiles = entries
        .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === ".xml")
        .map(entry => entry.name)
        .sort();

    /** @type {Array<{ fileName: string, xml: string, type: "layout" | "style" }>} */
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
 * @param {string} outputDir
 */
async function prepareOutputDirectory(outputDir) {
    try {
        await fs.mkdir(outputDir, { recursive: true });
    } catch (dirError) {
        throw createContextualError("出力先ディレクトリーの作成に失敗しました", dirError);
    }

    try {
        const existingEntries = await fs.readdir(outputDir, { withFileTypes: true });
        const cleanupTargets = existingEntries
            .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === ".xml")
            .map(entry => path.join(outputDir, entry.name));
        await Promise.all(cleanupTargets.map(targetPath => fs.rm(targetPath, { force: true })));
    } catch (cleanupError) {
        throw createContextualError("既存の出力ファイルの削除に失敗しました", cleanupError);
    }
}

/**
 * @param {string} outputDir
 * @param {Array<{ fileName: string, content: string }>} files
 */
async function writeMigratedFiles(outputDir, files) {
    await prepareOutputDirectory(outputDir);

    const writeOperations = [];
    const emittedFiles = [];
    for (const file of files) {
        const targetPath = path.join(outputDir, file.fileName);
        writeOperations.push(fs.writeFile(targetPath, `${file.content}\n`, "utf8"));
        emittedFiles.push(targetPath);
    }
    try {
        await Promise.all(writeOperations);
    } catch (writeError) {
        throw createContextualError("出力ファイルの書き込みに失敗しました", writeError);
    }
    console.log("\n変換結果を出力しました:");
    emittedFiles.forEach(filePath => {
        console.log("+", filePath);
    });
}

/**
 * @param {{ values: Record<string, any> }} args
 * @param {string} inputPath
 * @param {string | null} outputDir
 */
export async function migrateFrom2025_1(args, inputPath, outputDir) {
    let isDirectory = false;
    try {
        const stat = await fs.stat(inputPath);
        isDirectory = stat.isDirectory();
    } catch {
        throw new Error(`入力パスが見つかりません: ${inputPath}`);
    }

    /** @type {Array<{ fileName: string, xml: string, type: "layout" | "style" }>} */
    let inputFiles;

    if (isDirectory) {
        try {
            inputFiles = await readInputDirectory(inputPath);
        } catch (readError) {
            throw createContextualError("入力ディレクトリの読み込みに失敗しました", readError);
        }
        if (inputFiles.length === 0) {
            throw new Error("入力ディレクトリにXMLファイルが見つかりません");
        }
    } else {
        const ext = path.extname(inputPath);
        if (ext.toLowerCase() !== ".xml") {
            throw new Error("非対応のファイル形式です（*.xml のみ対応しています）");
        }
        try {
            const xml = await fs.readFile(inputPath, "utf-8");
            const type = detectXmlType(xml);
            inputFiles = [{ fileName: path.basename(inputPath), xml, type }];
        } catch (readError) {
            throw createContextualError("入力ファイルの読み込みに失敗しました", readError);
        }
    }

    /** @type {Array<{ fileName: string, content: string }>} */
    const migratedFiles = [];
    for (const file of inputFiles) {
        const migrated = migrateTo2026_1(file.xml, file.type);
        migratedFiles.push({ fileName: file.fileName, content: migrated });
    }

    const resolvedOutputDir = outputDir ?? getDefaultOutputDir(inputPath, isDirectory);

    if (args.values["dry-run"]) {
        for (const file of migratedFiles) {
            console.log(`=== ${file.fileName} ===`);
            console.log(file.content);
        }
        return;
    }

    await writeMigratedFiles(resolvedOutputDir, migratedFiles);
}
