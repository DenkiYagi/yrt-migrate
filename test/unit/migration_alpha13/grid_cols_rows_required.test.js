import { migrate } from "../../../src/migration_alpha13/grid_cols_rows_required.mjs";
import { setupWarningSpy } from "../../helpers/warning_spy.js";

describe("<Grid> cols, rows がなければそれぞれ \"*\" と \"auto\" を追加する", () => {
    let warningSpy;
    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });
    afterEach(() => {
        warningSpy.restore();
    });

    it("colsが未指定の場合に cols=\"*\" が追加される", () => {
        const xml = '<LinearLayout><Grid rows="1 1 1"></Grid></LinearLayout>';
        const yrtDocument = { layouts: [xml], style: null };
        const result = migrate(yrtDocument);
        const outXml = result.layouts[0];
        expect(outXml).toMatch(/<Grid\b[^>]*cols="\*"/);
        expect(outXml).toMatch(/<Grid\b[^>]*rows="1 1 1"/);
    });

    it("rowsが未指定の場合に rows=\"auto\" が追加される", () => {
        const xml = '<LinearLayout><Grid cols="1 1 1"></Grid></LinearLayout>';
        const yrtDocument = { layouts: [xml], style: null };
        const result = migrate(yrtDocument);
        const outXml = result.layouts[0];
        expect(outXml).toMatch(/<Grid\b[^>]*cols="1 1 1"[^>]*rows="auto"/);
    });

    it("cols, rows両方未指定の場合に cols=\"*\" rows=\"auto\" が追加される", () => {
        const xml = '<LinearLayout><Grid></Grid></LinearLayout>';
        const yrtDocument = { layouts: [xml], style: null };
        const result = migrate(yrtDocument);
        const outXml = result.layouts[0];
        expect(outXml).toMatch(/<Grid\b[^>]*cols="\*"[^>]*rows="auto"/);
    });

    it("cols, rows属性値に前後空白があっても正しく判定される", () => {
        const xml = '<LinearLayout><Grid cols="   1 1 1   " rows="   1 1 1   "></Grid></LinearLayout>';
        const yrtDocument = { layouts: [xml], style: null };
        migrate(yrtDocument);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("cols, rows両方指定されていれば警告が出ない", () => {
        const xml = '<LinearLayout><Grid cols="1 1 1" rows="1 1 1"></Grid></LinearLayout>';
        const yrtDocument = { layouts: [xml], style: null };
        migrate(yrtDocument);
        expect(warningSpy.messages()).toHaveLength(0);
    });

    it("Style XML に移した Grid には cols, rows を補完しない", () => {
        const styleXml = '<Style><Grid></Grid></Style>';
        const yrtDocument = { layouts: [], style: styleXml };
        const result = migrate(yrtDocument);
        // style内の<Grid>にはcols, rowsが追加されない
        expect(result.style).toBe(styleXml);
        // 警告も出ない
        expect(warningSpy.messages()).toHaveLength(0);
    });
});
