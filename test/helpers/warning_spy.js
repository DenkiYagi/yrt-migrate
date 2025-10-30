import { createDiagnosticsBuffer, formatDiagnostic } from "../../src/diagnostics.mjs";

/**
 * Collects warning diagnostics for assertions.
 * Retained for backward compatibility with existing tests that expect a spy object.
 */
export function setupWarningSpy() {
    const diagnostics = createDiagnosticsBuffer();
    return {
        diagnostics,
        messages: () =>
            diagnostics
                .filter(diagnostic => diagnostic.type === "warning")
                .map(formatDiagnostic),
        restore() {
            diagnostics.length = 0;
        },
    };
}

/**
 * Utility to run a function with an isolated diagnostics buffer.
 * @template T
 * @param {(diagnostics: import("../../src/diagnostics.mjs").DiagnosticsBuffer) => T} callback
 * @returns {{ warnings: string[], diagnostics: import("../../src/diagnostics.mjs").DiagnosticsBuffer, result: T }}
 */
export function withWarningSpy(callback) {
    const diagnostics = createDiagnosticsBuffer();
    const result = callback(diagnostics);
    const warnings = diagnostics
        .filter(diagnostic => diagnostic.type === "warning")
        .map(formatDiagnostic);
    return { warnings, diagnostics, result };
}
