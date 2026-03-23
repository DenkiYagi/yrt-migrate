import { cloneMigratedXmlCollection } from "../../../src/migration_alpha13/yrt_format.js";

describe("cloneMigratedXmlCollection", () => {
    it("layouts配列をコピーし、styleを保持する", () => {
        const original = {
            layouts: ["<StackLayout/>"],
            style: "<Style/>",
        };

        const cloned = cloneMigratedXmlCollection(original);
        cloned.layouts.push("<LinearLayout/>");

        expect(cloned).toEqual({
            layouts: ["<StackLayout/>", "<LinearLayout/>"],
            style: "<Style/>",
        });
        expect(original.layouts).toEqual(["<StackLayout/>"]);
    });

    it("styleがundefinedでもnullに正規化する", () => {
        const cloned = cloneMigratedXmlCollection(/** @type {any} */({
            layouts: ["<StackLayout/>"],
            style: undefined,
        }));

        expect(cloned.style).toBeNull();
    });
});
