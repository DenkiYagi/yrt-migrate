import { jest } from "@jest/globals";
import { migrate } from "../../src/migrate/grid_cols_rows_required.mjs";

describe("<Grid> cols, rows がなければそれぞれ \"*\" と \"auto\" を追加する", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("colsが未指定の場合に cols=\"*\" が追加される", () => {
        const xml = '<LinearLayout><Grid rows="1 1 1"></Grid></LinearLayout>';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const result = migrate(yrtDocument);
        const outXml = result.layouts[0].xml;
        expect(outXml).toMatch(/<Grid[^>]*cols="\*"/);
        expect(outXml).toMatch(/<Grid[^>]*rows="1 1 1"/);
    });

    it("rowsが未指定の場合に rows=\"auto\" が追加される", () => {
        const xml = '<LinearLayout><Grid cols="1 1 1"></Grid></LinearLayout>';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const result = migrate(yrtDocument);
        const outXml = result.layouts[0].xml;
        expect(outXml).toMatch(/<Grid[^>]*cols="1 1 1"[^>]*rows="auto"/);
    });

    it("cols, rows両方未指定の場合に cols=\"*\" rows=\"auto\" が追加される", () => {
        const xml = '<LinearLayout><Grid></Grid></LinearLayout>';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        const result = migrate(yrtDocument);
        const outXml = result.layouts[0].xml;
        expect(outXml).toMatch(/<Grid[^>]*cols="\*"[^>]*rows="auto"/);
    });

    it("cols, rows属性値に前後空白があっても正しく判定される", () => {
        const xml = '<LinearLayout><Grid cols="   1 1 1   " rows="   1 1 1   "></Grid></LinearLayout>';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("cols, rows両方指定されていれば警告が出ない", () => {
        const xml = '<LinearLayout><Grid cols="1 1 1" rows="1 1 1"></Grid></LinearLayout>';
        const yrtDocument = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(yrtDocument);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("Style XML に移した Grid には cols, rows を補完しない", () => {
        const styleXml = '<Style><Grid></Grid></Style>';
        const yrtDocument = { layouts: [], style: styleXml, assets: null };
        const result = migrate(yrtDocument);
        // style内の<Grid>にはcols, rowsが追加されない
        expect(result.style).toBe(styleXml);
        // 警告も出ない
        expect(warnSpy).not.toHaveBeenCalled();
    });
});
