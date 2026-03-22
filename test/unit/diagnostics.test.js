import { jest } from "@jest/globals";
import {
    addDiagnostic,
    createDiagnosticsBuffer,
    flushDiagnostics,
    formatDiagnostic
} from "../../src/diagnostics.mjs";

describe("diagnostics helpers", () => {
    it("createDiagnosticsBufferはsourcePath付きの空バッファーを返す", () => {
        const diagnostics = createDiagnosticsBuffer("input.xml");

        expect(diagnostics.sourcePath).toBe("input.xml");
        expect(diagnostics.items).toEqual([]);
    });

    it("addDiagnosticで診断メッセージを追加できる", () => {
        const diagnostics = createDiagnosticsBuffer("input.xml");
        const diagnostic = {
            type: "warning",
            messageLines: ["first line"],
            elementName: "Grid",
            line: 3,
            column: 5,
        };

        addDiagnostic(diagnostics, diagnostic);

        expect(diagnostics.items).toEqual([diagnostic]);
    });

    it("flushDiagnosticsは保持順に整形済み文字列をemitする", () => {
        const diagnostics = createDiagnosticsBuffer("input.xml");
        addDiagnostic(diagnostics, {
            type: "warning",
            messageLines: ["warning line"],
            elementName: "Grid",
            line: 3,
            column: 5,
        });
        addDiagnostic(diagnostics, {
            type: "error",
            messageLines: ["error line"],
            elementName: "",
            line: null,
            column: null,
        });
        const emit = jest.fn();

        flushDiagnostics(diagnostics, emit);

        expect(emit).toHaveBeenCalledTimes(2);
        expect(emit).toHaveBeenNthCalledWith(1, [
            "[WARNING] 3行5列目: <Grid>",
            "    warning line",
            "    input.xml:3:5"
        ].join("\n"));
        expect(emit).toHaveBeenNthCalledWith(2, [
            "[ERROR]",
            "    error line"
        ].join("\n"));
    });

    it("formatDiagnosticは行列情報がない場合でもメッセージを整形できる", () => {
        const formatted = formatDiagnostic({
            type: "warning",
            messageLines: ["message only"],
            elementName: "Image",
            line: null,
            column: null,
        }, "input.xml");

        expect(formatted).toBe([
            "[WARNING] <Image>",
            "    message only"
        ].join("\n"));
    });
});
