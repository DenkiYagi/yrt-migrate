import { createDiagnosticsBuffer, formatDiagnostic } from "../../src/diagnostics.mjs";

/**
 * Collects warning diagnostics for assertions.
 * Retained for backward compatibility with existing tests that expect a spy object.
 */
export function setupWarningSpy() {
    const diagnostics = createDiagnosticsBuffer("test-input.xml");
    return {
        diagnostics,
        messages: () =>
            diagnostics.items
                .filter(diagnostic => diagnostic.type === "warning")
                .map(d => formatDiagnostic(d, diagnostics.sourcePath)),
        restore() {
            diagnostics.items.length = 0;
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
    const diagnostics = createDiagnosticsBuffer("test-input.xml");
    const result = callback(diagnostics);
    const warnings = diagnostics.items
        .filter(diagnostic => diagnostic.type === "warning")
        .map(d => formatDiagnostic(d, diagnostics.sourcePath));
    return { warnings, diagnostics, result };
}
