import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../../src/migration_alpha13/warn_rectangle_border_radius_multi.mjs";
import { setupWarningSpy } from "../../helpers/warning_spy.js";

// <Rectangle> borderRadius属性の複数方向指定警告テスト

describe("<Rectangle> borderRadius属性 複数方向指定警告マイグレーション", () => {
    let warningSpy;
    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });
    afterEach(() => {
        warningSpy.restore();
    });

    it("複数値なら警告が出る", () => {
        const xml = '<LinearLayout><Rectangle borderRadius="1 2 3 4"/></LinearLayout>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining("Rectangle要素のborderRadius属性では、四隅に異なる値を指定することができなくなりました")]));
    });

    it("複数の<Rectangle>で複数方向指定があれば全て警告", () => {
        const xml = '<LinearLayout><Rectangle borderRadius="1 2"/><Rectangle borderRadius="3 4 5"/></LinearLayout>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toHaveLength(2);
    });

    it("単一値なら警告が出ない", () => {
        const xml = '<LinearLayout><Rectangle borderRadius="5"/></LinearLayout>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(warningSpy.diagnostics, doc, xml);
        expect(warningSpy.messages()).toHaveLength(0);
    });
});
