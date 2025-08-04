import { jest } from '@jest/globals';
import { migrate } from "./width_auto_range_warn.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("<Grid> cols属性のauto/range廃止マイグレーション 警告出力", () => {
    it("cols='auto' で警告が出る", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const xml = `<Grid cols="auto"></Grid>`;
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(spy).toHaveBeenCalledWith(
            expect.stringContaining("[width_auto_range_warn] 警告:"),
            expect.stringContaining("Grid")
        );
        expect(spy.mock.calls.flat().join("\n")).toMatch(/cols.*auto/);
        spy.mockRestore();
    });

    it("cols='  auto  '（前後空白あり）で警告が出る", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const xml = `<Grid cols="  auto  "></Grid>`;
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(spy.mock.calls.flat().join("\n")).toMatch(/cols.*auto/);
        spy.mockRestore();
    });

    it("cols='10:20' で警告が出る", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const xml = `<Grid cols="10:20"></Grid>`;
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(spy.mock.calls.flat().join("\n")).toMatch(/cols.*10:20/);
        spy.mockRestore();
    });

    it("cols=':20', cols='10:' でも警告が出る", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const xml1 = `<Grid cols=":20"></Grid>`;
        const xml2 = `<Grid cols="10:"></Grid>`;
        const yrtRoot1 = toYrtRoot({ layouts: [xml1] });
        const yrtRoot2 = toYrtRoot({ layouts: [xml2] });
        migrate(yrtRoot1);
        migrate(yrtRoot2);
        expect(spy.mock.calls.flat().join("\n")).toMatch(/cols.*:20/);
        expect(spy.mock.calls.flat().join("\n")).toMatch(/cols.*10:/);
        spy.mockRestore();
    });

    it("正常な値では警告が出ない", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const xml = `<Grid cols="3"></Grid>`;
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(spy).not.toHaveBeenCalled();

        spy.mockRestore();
    });
});

describe("<TableColumn> width属性のauto/range廃止マイグレーション 警告出力", () => {
    it("width='auto' で警告が出る", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const xml = `<TableColumn width="auto"></TableColumn>`;
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(spy.mock.calls.flat().join("\n")).toMatch(/TableColumn.*width.*auto/);
        spy.mockRestore();
    });

    it("width='  auto  '（前後空白あり）で警告が出る", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const xml = `<TableColumn width="  auto  "></TableColumn>`;
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(spy.mock.calls.flat().join("\n")).toMatch(/TableColumn.*width.*auto/);
        spy.mockRestore();
    });

    it("width='5:10' で警告が出る", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const xml = `<TableColumn width="5:10"></TableColumn>`;
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(spy.mock.calls.flat().join("\n")).toMatch(/width.*5:10/);
        spy.mockRestore();
    });

    it("正常な値では警告が出ない", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => { });
        const xml = `<TableColumn width="100"></TableColumn>`;
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(spy).not.toHaveBeenCalled();
        spy.mockRestore();
    });
});
