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
 * 診断メッセージを蓄えるバッファーを生成する。
 * @returns {Diagnostic[]}
 */
export function createDiagnosticsBuffer() {
    return [];
}

/**
 * 診断メッセージをバッファーに追加する。
 * @param {Diagnostic[]} diagnostics
 * @param {Diagnostic} diagnostic
 */
export function addDiagnostic(diagnostics, diagnostic) {
    diagnostics.push(diagnostic);
}

/**
 * 診断メッセージを人が読みやすい文字列に整形する。
 * @param {Diagnostic} diagnostic
 * @returns {string}
 */
export function formatDiagnostic(diagnostic) {
    const elementPart =
        diagnostic.elementName && diagnostic.elementName.length > 0
            ? ` (<${diagnostic.elementName}>)`
            : "";
    const locationPart =
        diagnostic.line != null && diagnostic.column != null
            ? ` @${diagnostic.line}:${diagnostic.column}`
            : "";
    return `[${diagnostic.type.toUpperCase()}] ${diagnostic.message}${elementPart}${locationPart}`;
}

/**
 * 保持している診断メッセージをまとめて出力する。
 * @param {Diagnostic[]} diagnostics
 * @param {(message: string) => void} [emit]
 */
export function flushDiagnostics(diagnostics, emit = console.warn) {
    diagnostics.forEach(diagnostic => {
        emit(formatDiagnostic(diagnostic));
    });
}
