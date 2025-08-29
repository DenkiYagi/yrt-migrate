import { jest } from "@jest/globals";
import { migrate } from "../../src/migrate/grid_cols_rows_required_warn.mjs";
import { toYrtRoot } from "../../src/utils.js";

describe("<Grid> cols, rows属性省略不可警告マイグレーション", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("cols, rows両方未指定の場合に警告が出る", () => {
        const xml = '<LinearLayout><Grid></Grid></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<Grid>のcols, rows属性は省略できません"));
    });

    it("colsのみ未指定の場合に警告が出る", () => {
        const xml = '<LinearLayout><Grid rows="1 1 1"></Grid></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<Grid>のcols, rows属性は省略できません"));
    });

    it("rowsのみ未指定の場合に警告が出る", () => {
        const xml = '<LinearLayout><Grid cols="1 1 1"></Grid></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<Grid>のcols, rows属性は省略できません"));
    });

    it("cols, rows属性値に前後空白があっても正しく判定される", () => {
        const xml = '<LinearLayout><Grid cols="   1 1 1   " rows="   1 1 1   "></Grid></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("cols, rows属性値が空白のみの場合は警告が出る", () => {
        const xml = '<LinearLayout><Grid cols="   " rows="   "></Grid></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<Grid>のcols, rows属性は省略できません"));
    });

    it("cols, rows両方指定されていれば警告が出ない", () => {
        const xml = '<LinearLayout><Grid cols="1 1 1" rows="1 1 1"></Grid></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("複数の<Grid>で未指定があれば全て警告", () => {
        const xml = '<LinearLayout><Grid cols="1 1 1"></Grid><Grid></Grid></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it("<GridCell>の中に<Grid>を入れ子にした場合、両方未指定なら2回警告", () => {
        const xml = `
            <LinearLayout>
                <Grid>
                    <GridCell>
                        <Grid></Grid>
                    </GridCell>
                </Grid>
            </LinearLayout>
        `;
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).toHaveBeenCalledTimes(2);
        expect(warnSpy).toHaveBeenNthCalledWith(1, expect.stringContaining("<Grid>のcols, rows属性は省略できません"));
        expect(warnSpy).toHaveBeenNthCalledWith(2, expect.stringContaining("<Grid>のcols, rows属性は省略できません"));
    });
});
