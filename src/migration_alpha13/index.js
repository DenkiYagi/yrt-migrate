// @ts-check

import * as fs from "fs/promises";
import * as path from "path";
import { DOMParser } from "@xmldom/xmldom";
import { formatXmlPretty, removeIndents } from "../formatter.mjs";
import { createDiagnosticsBuffer, flushDiagnostics, formatDiagnostic } from "../diagnostics.mjs";
import { validateXmlInput } from "./input_file_validator.mjs";
import { migrate as multipleXmls } from "./multiple_xmls.mjs";
import { migrate as orientationRename } from "./orientation_rename.mjs";
import { migrate as removeUnspecifiedAttr } from "./remove_unspecified_attr.mjs";
import { migrate as warnStyleElementBinding } from "./warn_grid_like_style_element_binding.mjs";
import { migrate as styleElementMigrate } from "./style_element.mjs";
import { migrate as removeContentElements } from "./remove_content_elements.mjs";
import { migrate as warnForeachHidden } from "./warn_foreach_hidden.mjs";
import { migrate as foreachHiddenToLogicMigrate } from "./foreach_hidden_to_logic.mjs";
import { migrate as warnDeprecatedLayoutAttrs } from "./warn_deprecated_layout_attrs.mjs";
import { migrate as addLayoutBody } from "./add_layout_body.mjs";
import { migrate as renameTableFrameElements } from "./rename_tableframe_elements.mjs";
import { migrate as warnImageWidthRequired } from "./warn_image_width_required.mjs";
import { migrate as renameAttrsMigrate } from "./rename_attrs.mjs";
import { migrate as warnGridLikeBorderConflict } from "./warn_grid_like_border_conflict.mjs";
import { migrate as warnGridLikeStyleElementBorderConflict } from "./warn_grid_like_style_element_border_conflict.mjs";
import { migrate as mergeDirectionalAttrs } from "./merge_directional_attrs.mjs";
import { migrate as warnWidthAutoRange } from "./warn_width_auto_range.mjs";
import { migrate as colorNotationIllustrator } from "./color_notation_illustrator.mjs";
import { migrate as warnBindingRequired } from "./warn_binding_required.mjs";
import { migrate as warnSpanColorBinding } from "./warn_span_color_binding.mjs";
import { migrate as gridColsRowsRequired } from "./grid_cols_rows_required.mjs";
import { migrate as warnRectangleBorderRadiusMulti } from "./warn_rectangle_border_radius_multi.mjs";
import { migrate as sizeCommaToSpace } from "./size_comma_to_space.mjs";
import { migrate as borderstyleDasharrayToColon } from "./borderstyle_dasharray_to_colon.mjs";
import { migrate as warnLinearLayoutChildrenBorder } from "./warn_linear_layout_children_border.mjs";
import { migrate as applySchema } from "./apply_schema.mjs";

const DO_FORMAT_XML = true;

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
 * @param {import("./yrt_format.js").LegacyLayoutDocument} legacyDocument
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @returns {import("./yrt_format.js").MigratedXmlCollection}
 */
function migrate(legacyDocument, diagnostics) {
    const originalXml = legacyDocument.xml;
    const originalDocument = new DOMParser().parseFromString(originalXml, "text/xml");

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

/**
 * @param {string} inputFileName
 * @returns {string}
 */
function getDefaultOutputDir(inputFileName) {
    const parsed = path.parse(inputFileName);
    const parentDir = parsed.dir === "" ? "." : parsed.dir;
    return path.join(parentDir, `${parsed.name}-2025.1`);
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
            .filter(entry => entry.isFile() && (/^layout-\d+\.xml$/u.test(entry.name) || entry.name === "style.xml"))
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
export async function migrateFromAlpha13(args, inputPath, outputDir) {
    const resolvedOutputDir = outputDir ?? getDefaultOutputDir(inputPath);
    const ext = path.extname(inputPath);
    if (ext.toLowerCase() !== ".xml") {
        throw new Error("非対応のファイル形式です（*.xml のみ対応しています）");
    }

    let inputLegacyDoc;
    try {
        inputLegacyDoc = await validateXmlInput(inputPath);
    } catch (validationError) {
        throw createContextualError("入力ファイルの検証に失敗しました", validationError);
    }

    const diagnosticsOutput = args.values.diagnostics;
    const diagnostics = createDiagnosticsBuffer(inputPath);
    let migratedDoc = migrate(inputLegacyDoc, diagnostics);
    if (diagnosticsOutput) {
        try {
            const formatted = diagnostics.items.map(d => formatDiagnostic(d, diagnostics.sourcePath)).join("\n");
            await fs.writeFile(diagnosticsOutput, formatted.length > 0 ? `${formatted}\n` : "");
        } catch (diagnosticsError) {
            throw createContextualError("警告ファイルの書き出しに失敗しました", diagnosticsError);
        }
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
        return;
    }

    /** @type {Array<{ fileName: string, content: string }>} */
    const files = [];
    migratedDoc.layouts.forEach((layoutXml, idx) => {
        files.push({ fileName: `layout-${idx + 1}.xml`, content: layoutXml });
    });
    if (typeof migratedDoc.style === "string" && migratedDoc.style.trim().length > 0) {
        files.push({ fileName: "style.xml", content: migratedDoc.style });
    }
    await writeMigratedFiles(resolvedOutputDir, files);
}
