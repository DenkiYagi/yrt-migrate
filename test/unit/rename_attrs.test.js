import { DOMParser } from "@xmldom/xmldom";
import { migrate } from "../../src/migrate/rename_attrs.mjs";

describe("属性名のリネームマイグレーション", () => {
    it("Table要素のpageBreakCondition属性がbreakConditionにリネームされる", () => {
        const input = '<Table pageBreakCondition="${tableBreak}" />';
        const yrtDocument = { layouts: [input], style: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0], "text/xml");
        const table = doc.getElementsByTagName("Table")[0];
        expect(table.hasAttribute("pageBreakCondition")).toBe(false);
        expect(table.getAttribute("breakCondition")).toBe("${tableBreak}");
    });

    it("Grid要素のborderRadius属性がouterBorderRadiusにリネームされる", () => {
        const input = '<Grid borderRadius="8" />';
        const yrtDocument = { layouts: [input], style: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0], "text/xml");
        const grid = doc.getElementsByTagName("Grid")[0];
        expect(grid.hasAttribute("borderRadius")).toBe(false);
        expect(grid.getAttribute("outerBorderRadius")).toBe("8");
    });

    it("他の属性や要素には影響しない", () => {
        const input = [
            '<StackLayout>',
            '  <Table breakCondition="${otherBreak}" />',
            '  <Grid outerBorderRadius="12" />',
            '</StackLayout>'].join('\n');
        const yrtDocument = { layouts: [input], style: null };
        const migrated = migrate(yrtDocument);
        const doc = new DOMParser().parseFromString(migrated.layouts[0], "text/xml");
        const table = doc.getElementsByTagName("Table")[0];
        const grid = doc.getElementsByTagName("Grid")[0];
        expect(table.getAttribute("breakCondition")).toBe("${otherBreak}");
        expect(grid.getAttribute("outerBorderRadius")).toBe("12");
    });
});
