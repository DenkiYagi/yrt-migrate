import { migrate } from "./remove_unspecified_attr.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("remove_unspecified_attr", () => {
    function normalize(xml) {
        return xml.replace(/\s+/g, "");
    }

    it("unspecified値の属性は削除される", () => {
        const input = `
<LinearLayout marginTop="unspecified" borderTopThickness="unspecified">
  <Text marginRight="unspecified">foo</Text>
</LinearLayout>
`;
        const expected = `
<LinearLayout>
  <Text>foo</Text>
</LinearLayout>
`;
        const yrtRoot = toYrtRoot({ layouts: [input] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        expect(normalize(layouts[0])).toBe(normalize(expected));
    });

    it("unspecified値の属性のみ削除され、他の値は残る（混在状態）", () => {
        const input = `
<LinearLayout marginTop="unspecified" marginBottom="unspecified" marginLeft="5" marginRight="unspecified" borderTopThickness="unspecified" borderBottomThickness="2" borderLeftThickness="unspecified" borderRightThickness="unspecified">
  <Text borderTopColor="unspecified" borderBottomColor="red" borderLeftColor="unspecified" borderRightColor="blue">foo</Text>
</LinearLayout>
`;
        const expected = `
<LinearLayout marginLeft="5" borderBottomThickness="2">
  <Text borderBottomColor="red" borderRightColor="blue">foo</Text>
</LinearLayout>
`;
        const yrtRoot = toYrtRoot({ layouts: [input] });
        const migrated = migrate(yrtRoot);
        const { layouts } = fromYrtRoot(migrated);
        expect(normalize(layouts[0])).toBe(normalize(expected));
    });
});
