import { jest } from '@jest/globals';
import { migrate } from "./border_adjacent_line_warning.mjs";
import { toYrtRoot } from "./utils.js";

describe("border_adjacent_line_warning（レイアウト隣接罫線警告）", () => {
    let warnSpy;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it("LayoutHeaderにborderThickness属性があれば警告する", () => {
        const yrt = toYrtRoot({
            layouts: [
                `<LinearLayout><LayoutHeader borderThickness="1"/></LinearLayout>`
            ]
        });
        migrate(yrt);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("LayoutHeader 要素")
        );
    });

    it("LayoutBodyにborderColor属性があれば警告する", () => {
        const yrt = toYrtRoot({
            layouts: [
                `<LinearLayout><LayoutBody borderColor="#000"/></LinearLayout>`
            ]
        });
        migrate(yrt);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("LayoutBody 要素")
        );
    });

    it("LayoutFooterにborderStyle属性があれば警告する", () => {
        const yrt = toYrtRoot({
            layouts: [
                `<LinearLayout><LayoutFooter borderStyle="solid"/></LinearLayout>`
            ]
        });
        migrate(yrt);
        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("LayoutFooter 要素")
        );
    });

    it("対象属性がなければ警告しない", () => {
        const yrt = toYrtRoot({
            layouts: [
                `<LinearLayout><LayoutHeader/><LayoutBody/><LayoutFooter/></LinearLayout>`
            ]
        });
        migrate(yrt);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it("複数要素に対象属性があればそれぞれ警告する", () => {
        const yrt = toYrtRoot({
            layouts: [
                `<LinearLayout><LayoutHeader borderThickness="1"/><LayoutBody borderColor="#000"/></LinearLayout>`
            ]
        });
        migrate(yrt);
        expect(warnSpy).toHaveBeenCalledTimes(2);
    });
});
