// @ts-check

/**
 * @typedef {"warning" | "error"} DiagnosticType
 */

/**
 * @typedef {Object} Diagnostic
 * @property {DiagnosticType} type
 * @property {string} message
 * @property {string} elementName
 * @property {number | null} line
 * @property {number | null} column
 */

/**
 * 診断メッセージを保持するバッファー。
 * 入力ファイルパスと診断メッセージの配列を保持する。
 */
export class DiagnosticsBuffer {
    /**
     * @param {string} sourcePath
     */
    constructor(sourcePath) {
        /** @type {string} */
        this.sourcePath = sourcePath;
        /** @type {Diagnostic[]} */
        this.items = [];
    }
}

/**
 * 診断メッセージを蓄えるバッファーを生成する。
 * @param {string} sourcePath
 * @returns {DiagnosticsBuffer}
 */
export function createDiagnosticsBuffer(sourcePath) {
    return new DiagnosticsBuffer(sourcePath);
}

/**
 * 診断メッセージをバッファーに追加する。
 * @param {DiagnosticsBuffer} diagnostics
 * @param {Diagnostic} diagnostic
 */
export function addDiagnostic(diagnostics, diagnostic) {
    diagnostics.items.push(diagnostic);
}

/**
 * 診断メッセージを人が読みやすい文字列に整形する。
 * @param {Diagnostic} diagnostic
 * @param {string} sourcePath
 * @returns {string}
 */
export function formatDiagnostic(diagnostic, sourcePath) {
    const elementLabel =
        diagnostic.elementName && diagnostic.elementName.length > 0
            ? `<${diagnostic.elementName}>`
            : "";
    const hasLineAndColumn =
        typeof diagnostic.line === "number" && typeof diagnostic.column === "number";
    let headerSuffix = "";
    if (hasLineAndColumn) {
        headerSuffix = `${diagnostic.line}行${diagnostic.column}列目`;
        if (elementLabel) {
            headerSuffix = `${headerSuffix}: ${elementLabel}`;
        }
    } else if (elementLabel) {
        headerSuffix = elementLabel;
    }
    const header =
        headerSuffix && headerSuffix.length > 0
            ? `[${diagnostic.type.toUpperCase()}] ${headerSuffix}`
            : `[${diagnostic.type.toUpperCase()}]`;
    const message = typeof diagnostic.message === "string" ? diagnostic.message : "";
    const messageLines =
        message.length > 0
            ? message.split(/\r?\n/).map(line => `    ${line}`)
            : [];
    const locationLine =
        hasLineAndColumn && sourcePath.length > 0
            ? `    ${sourcePath}:${diagnostic.line}:${diagnostic.column}`
            : null;
    const lines = [header, ...messageLines];
    if (locationLine) {
        lines.push(locationLine);
    }
    return lines.join("\n");
}

/**
 * 保持している診断メッセージをまとめて出力する。
 * @param {DiagnosticsBuffer} diagnostics
 * @param {(message: string) => void} [emit]
 */
export function flushDiagnostics(diagnostics, emit = console.warn) {
    diagnostics.items.forEach(diagnostic => {
        emit(formatDiagnostic(diagnostic, diagnostics.sourcePath));
    });
}
