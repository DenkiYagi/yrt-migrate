import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "./rename_attrs.mjs";

describe("属性名のリネームマイグレーション", () => {
    it("Table要素のpageBreakCondition属性がbreakConditionにリネームされる", () => {
        // スキーマ例: バインド変数形式
        const xml = '<Table pageBreakCondition="${tableBreak}" />';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        const table = doc.getElementsByTagName("Table")[0];
        expect(table.hasAttribute("pageBreakCondition")).toBe(false);
        expect(table.getAttribute("breakCondition")).toBe("${tableBreak}");
    });

    it("Grid要素のborderRadius属性がouterBorderRadiusにリネームされる", () => {
        // スキーマ例: 数値
        const xml = `<Grid borderRadius="8" />`;
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        const grid = doc.getElementsByTagName("Grid")[0];
        expect(grid.hasAttribute("borderRadius")).toBe(false);
        expect(grid.getAttribute("outerBorderRadius")).toBe("8");
    });

    it("他の属性や要素には影響しない", () => {
        const xml = '<StackLayout><Table breakCondition="${otherBreak}" /><Grid outerBorderRadius="12" /></StackLayout>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc);
        const table = doc.getElementsByTagName("Table")[0];
        const grid = doc.getElementsByTagName("Grid")[0];
        expect(table.getAttribute("breakCondition")).toBe("${otherBreak}");
        expect(grid.getAttribute("outerBorderRadius")).toBe("12");
    });
});
