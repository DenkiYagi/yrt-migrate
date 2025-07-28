import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { migrate } from "./add_layout_body.mjs";

describe("add_layout_body", () => {
    function normalize(xml) {
        const serialized = new XMLSerializer().serializeToString(
            new DOMParser().parseFromString(xml, "text/xml")
        );
        // 空白やインデントの違いで構造比較が失敗しないよう、全ての空白文字を除去して比較
        // なぜなら、XMLの構造変換では空白の位置が曖昧になりやすく、
        // それによる差異でテストが失敗するのは本質的でないため。
        return serialized.replace(/\s+/g, "");
    }

    it("<LinearLayout> 直下に <LayoutBody> がない場合、ヘッダー・フッター以外を <LayoutBody> で囲む", () => {
        const input = `
<LinearLayout>
  <LayoutHeader>header</LayoutHeader>
  <Text>body1</Text>
  <Text>body2</Text>
  <LayoutFooter>footer</LayoutFooter>
</LinearLayout>
`;
        const expected = `
<LinearLayout>
  <LayoutHeader>header</LayoutHeader>
  <LayoutBody>
    <Text>body1</Text>
    <Text>body2</Text>
  </LayoutBody>
  <LayoutFooter>footer</LayoutFooter>
</LinearLayout>
`;
        expect(normalize(migrate(input))).toBe(normalize(expected));
    });

    it("<LinearLayout> 直下に <LayoutBody> が既にある場合は何もしない", () => {
        const input = `
<LinearLayout>
  <LayoutHeader>header</LayoutHeader>
  <LayoutBody>
    <Text>body</Text>
  </LayoutBody>
  <LayoutFooter>footer</LayoutFooter>
</LinearLayout>
`;
        expect(normalize(migrate(input))).toBe(normalize(input));
    });

    it("<LinearLayout> のみで <LayoutHeader> や <LayoutFooter> がない場合も <LayoutBody> で囲む", () => {
        const input = `
<LinearLayout>
  <Text>body1</Text>
  <Text>body2</Text>
</LinearLayout>
`;
        const expected = `
<LinearLayout>
  <LayoutBody>
    <Text>body1</Text>
    <Text>body2</Text>
  </LayoutBody>
</LinearLayout>
`;
        expect(normalize(migrate(input))).toBe(normalize(expected));
    });

    it("<LinearLayout> 直下に何もない場合は何もしない", () => {
        const input = `<LinearLayout></LinearLayout>`;
        expect(normalize(migrate(input))).toBe(normalize(input));
    });
});
