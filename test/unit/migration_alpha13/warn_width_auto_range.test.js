import { describe, it, expect } from '@jest/globals';
import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../../src/migration_alpha13/warn_width_auto_range.mjs";
import { withWarningSpy } from "../../helpers/warning_spy.js";

const parse = (xml) => new DOMParser().parseFromString(xml, "text/xml");

describe("<Grid> cols属性のauto/range廃止マイグレーション 警告出力", () => {
    it("cols='auto' で警告が出る", () => {
        const xml = `<Grid cols="auto"></Grid>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("cols='  auto  '（前後空白あり）で警告が出る", () => {
        const xml = `<Grid cols="  auto  "></Grid>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("colsに複数の値が入っていた場合も警告が出る(1)", () => {
        const xml = `<Grid cols="auto auto"></Grid>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("colsに複数の値が入っていた場合も警告が出る(2)", () => {
        const xml = `<Grid cols="* * auto"></Grid>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("cols='AuTo'（大文字・小文字混在）で警告が出る", () => {
        const xml = `<Grid cols="AuTo"></Grid>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("cols='10:20' で警告が出る", () => {
        const xml = `<Grid cols="10:20"></Grid>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("cols='3.5:4.5' で警告が出る", () => {
        const xml = `<Grid cols="3.5:4.5"></Grid>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("cols=':20', cols='10:' でも警告が出る", () => {
        const xml1 = `<Grid cols=":20"></Grid>`;
        const xml2 = `<Grid cols="10:"></Grid>`;
        const doc1 = parse(xml1);
        const doc2 = parse(xml2);
        const { warnings } = withWarningSpy(diagnostics => {
            migrate(diagnostics, doc1, xml1);
            migrate(diagnostics, doc2, xml2);
        });
        expect(warnings).not.toHaveLength(0);
    });

    it("正常な値では警告が出ない", () => {
        const xml = `<Grid cols="3"></Grid>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).toHaveLength(0);
    });
});

describe("<TableColumn> width属性のauto/range廃止マイグレーション 警告出力", () => {
    it("width='auto' で警告が出る", () => {
        const xml = `<TableColumn width="auto"></TableColumn>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("width='  auto  '（前後空白あり）で警告が出る", () => {
        const xml = `<TableColumn width="  auto  "></TableColumn>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("width='AuTo'（大文字・小文字混在）で警告が出る", () => {
        const xml = `<TableColumn width="AuTo"></TableColumn>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("width='5:10' で警告が出る", () => {
        const xml = `<TableColumn width="5:10"></TableColumn>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("width='5.5:10.5' で警告が出る", () => {
        const xml = `<TableColumn width="5.5:10.5"></TableColumn>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it("正常な値では警告が出ない", () => {
        const xml = `<TableColumn width="100"></TableColumn>`;
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).toHaveLength(0);
    });
});
