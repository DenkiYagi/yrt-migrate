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
 * @property {string | null} inputXmlPath
 */

/**
 * @typedef {Object} DiagnosticsBufferOptions
 * @property {string | null | undefined} [sourcePath]
 */

/**
 * 診断メッセージを保持する配列ラッパー。
 * Array を継承し、入力ファイルパスなどのメタデータを保持する。
 * @extends Array<Diagnostic>
 */
export class DiagnosticsBuffer extends Array {
    /**
     * @param {DiagnosticsBufferOptions | number} [options]
     */
    constructor(options = {}) {
        if (typeof options === "number") {
            super(options);
            /** @type {string | null} */
            this.sourcePath = null;
        } else {
            super();
            /** @type {string | null} */
            this.sourcePath = options?.sourcePath ?? null;
        }
    }

    static get [Symbol.species]() {
        return Array;
    }
}

/**
 * 診断メッセージを蓄えるバッファーを生成する。
 * @param {DiagnosticsBufferOptions} [options]
 * @returns {DiagnosticsBuffer}
 */
export function createDiagnosticsBuffer(options = {}) {
    return new DiagnosticsBuffer(options);
}

/**
 * 診断メッセージをバッファーに追加する。
 * @param {DiagnosticsBuffer} diagnostics
 * @param {Diagnostic} diagnostic
 */
export function addDiagnostic(diagnostics, diagnostic) {
    const sourcePath =
        typeof diagnostics.sourcePath === "string" && diagnostics.sourcePath.length > 0
            ? diagnostics.sourcePath
            : null;
    diagnostics.push({
        ...diagnostic,
        inputXmlPath:
            typeof diagnostic.inputXmlPath === "string" && diagnostic.inputXmlPath.length > 0
                ? diagnostic.inputXmlPath
                : sourcePath,
    });
}

/**
 * 診断メッセージを人が読みやすい文字列に整形する。
 * @param {Diagnostic} diagnostic
 * @returns {string}
 */
export function formatDiagnostic(diagnostic) {
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
        hasLineAndColumn &&
            typeof diagnostic.inputXmlPath === "string" &&
            diagnostic.inputXmlPath.length > 0
            ? `    ${diagnostic.inputXmlPath}:${diagnostic.line}:${diagnostic.column}`
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
    diagnostics.forEach(diagnostic => {
        emit(formatDiagnostic(diagnostic));
    });
}
