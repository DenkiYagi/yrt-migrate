import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "./rename_attrs.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("属性名のリネームマイグレーション", () => {
    it("Table要素のpageBreakCondition属性がbreakConditionにリネームされる", () => {
        // スキーマ例: バインド変数形式
        const input = '<Table pageBreakCondition="${tableBreak}" />';
        const yrtRoot = toYrtRoot({ layouts: [input] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
        const table = doc.getElementsByTagName("Table")[0];
        expect(table.hasAttribute("pageBreakCondition")).toBe(false);
        expect(table.getAttribute("breakCondition")).toBe("${tableBreak}");
    });

    it("Grid要素のborderRadius属性がouterBorderRadiusにリネームされる", () => {
        // スキーマ例: 数値
        const input = `<Grid borderRadius="8" />`;
        const yrtRoot = toYrtRoot({ layouts: [input] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
        const grid = doc.getElementsByTagName("Grid")[0];
        expect(grid.hasAttribute("borderRadius")).toBe(false);
        expect(grid.getAttribute("outerBorderRadius")).toBe("8");
    });

    it("他の属性や要素には影響しない", () => {
        const input = '<StackLayout><Table breakCondition="${otherBreak}" /><Grid outerBorderRadius="12" /></StackLayout>';
        const yrtRoot = toYrtRoot({ layouts: [input] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        const doc = new DOMParser().parseFromString(layouts[0], "text/xml");
        const table = doc.getElementsByTagName("Table")[0];
        const grid = doc.getElementsByTagName("Grid")[0];
        expect(table.getAttribute("breakCondition")).toBe("${otherBreak}");
        expect(grid.getAttribute("outerBorderRadius")).toBe("12");
    });
});
