import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { migrate } from "./rename_tableframe_elements.mjs";

describe("rename_tableframe_elements", () => {
    function normalize(xml) {
        const serialized = new XMLSerializer().serializeToString(
            new DOMParser().parseFromString(xml, "text/xml")
        );
        // 空白やインデントの違いで構造比較が失敗しないよう、全ての空白文字を除去して比較
        // なぜなら、XMLの構造変換では空白の位置が曖昧になりやすく、
        // それによる差異でテストが失敗するのは本質的でないため。
        return serialized.replace(/\s+/g, "");
    }

    it("<TableFrame> を <Frame> にリネームする", () => {
        const input = `<TableFrame><Text>foo</Text></TableFrame>`;
        const expected = `<Frame><Text>foo</Text></Frame>`;
        expect(normalize(migrate(input))).toBe(normalize(expected));
    });

    it("<TableHeader> を <FrameHeader> にリネームする", () => {
        const input = `<TableHeader><Text>bar</Text></TableHeader>`;
        const expected = `<FrameHeader><Text>bar</Text></FrameHeader>`;
        expect(normalize(migrate(input))).toBe(normalize(expected));
    });

    it("<TablePageHeader> を <FramePageHeader> にリネームする", () => {
        const input = `<TablePageHeader><Text>baz</Text></TablePageHeader>`;
        const expected = `<FramePageHeader><Text>baz</Text></FramePageHeader>`;
        expect(normalize(migrate(input))).toBe(normalize(expected));
    });

    it("<TablePageFooter> を <FramePageFooter> にリネームする", () => {
        const input = `<TablePageFooter><Text>qux</Text></TablePageFooter>`;
        const expected = `<FramePageFooter><Text>qux</Text></FramePageFooter>`;
        expect(normalize(migrate(input))).toBe(normalize(expected));
    });

    it("<TableFooter> を <FrameFooter> にリネームする", () => {
        const input = `<TableFooter><Text>end</Text></TableFooter>`;
        const expected = `<FrameFooter><Text>end</Text></FrameFooter>`;
        expect(normalize(migrate(input))).toBe(normalize(expected));
    });

    it("複数の対象要素が混在していても全てリネームされる", () => {
        const input = `
<TableFrame><TableHeader></TableHeader><TablePageHeader></TablePageHeader><TablePageFooter></TablePageFooter><TableFooter></TableFooter></TableFrame>
`;
        const expected = `
<Frame><FrameHeader></FrameHeader><FramePageHeader></FramePageHeader><FramePageFooter></FramePageFooter><FrameFooter></FrameFooter></Frame>
`;
        expect(normalize(migrate(input))).toBe(normalize(expected));
    });
    it("入れ子になった対象要素も全てリネームされる", () => {
        const input = `
<TableFrame>
  <TableHeader>
    <TablePageHeader>
      <TableFooter></TableFooter>
    </TablePageHeader>
  </TableHeader>
</TableFrame>
`;
        const expected = `
<Frame>
  <FrameHeader>
    <FramePageHeader>
      <FrameFooter></FrameFooter>
    </FramePageHeader>
  </FrameHeader>
</Frame>
`;
        expect(normalize(migrate(input))).toBe(normalize(expected));
    });
});
