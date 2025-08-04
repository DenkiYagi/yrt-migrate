import { jest } from "@jest/globals";
import { migrate } from "./rectangle_border_radius_multi_warn.mjs";
import { toYrtRoot } from "./utils.js";

// <Rectangle> borderRadius属性の複数方向指定警告テスト

describe("<Rectangle> borderRadius属性 複数方向指定警告マイグレーション", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("複数値なら警告が出る", () => {
        const xml = '<LinearLayout><Rectangle borderRadius="1 2 3 4"/></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("<Rectangle>のborderRadius属性は単一値のみ許可されています"));
    });

    it("複数の<Rectangle>で複数方向指定があれば全て警告", () => {
        const xml = '<LinearLayout><Rectangle borderRadius="1 2"/><Rectangle borderRadius="3 4 5"/></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).toHaveBeenCalledTimes(2);
    });

    it("単一値なら警告が出ない", () => {
        const xml = '<LinearLayout><Rectangle borderRadius="5"/></LinearLayout>';
        const yrtRoot = toYrtRoot({ layouts: [xml] });
        migrate(yrtRoot);
        expect(warnSpy).not.toHaveBeenCalled();
    });
});
