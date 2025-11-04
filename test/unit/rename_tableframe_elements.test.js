import { migrate } from "../../src/migrate/rename_tableframe_elements.mjs";

describe("rename_tableframe_elements", () => {
  function normalize(xml) {
    // XML文字列を正規化して比較
    // 空要素の省略記法 <tag/> を <tag></tag> に統一
    return xml
      .replace(/\s+/g, "")
      .replace(/<([a-zA-Z0-9_:-]+)\/>/g, '<$1></$1>');
  }

  it("<TableFrame> を <Frame> にリネームする", () => {
    const input = '<TableFrame><Text>foo</Text></TableFrame>';
    const expected = '<Frame><Text>foo</Text></Frame>';
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("<TableHeader> を <FrameHeader> にリネームする", () => {
    const input = '<TableHeader><Text>bar</Text></TableHeader>';
    const expected = '<FrameHeader><Text>bar</Text></FrameHeader>';
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("<TablePageHeader> を <FramePageHeader> にリネームする", () => {
    const input = '<TablePageHeader><Text>baz</Text></TablePageHeader>';
    const expected = '<FramePageHeader><Text>baz</Text></FramePageHeader>';
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("<TablePageFooter> を <FramePageFooter> にリネームする", () => {
    const input = '<TablePageFooter><Text>qux</Text></TablePageFooter>';
    const expected = '<FramePageFooter><Text>qux</Text></FramePageFooter>';
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("<TableFooter> を <FrameFooter> にリネームする", () => {
    const input = '<TableFooter><Text>end</Text></TableFooter>';
    const expected = '<FrameFooter><Text>end</Text></FrameFooter>';
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("複数の対象要素が混在していても全てリネームされる", () => {
    const input = '<TableFrame><TableHeader></TableHeader><TablePageHeader></TablePageHeader><TablePageFooter></TablePageFooter><TableFooter></TableFooter></TableFrame>';
    const expected = '<Frame><FrameHeader></FrameHeader><FramePageHeader></FramePageHeader><FramePageFooter></FramePageFooter><FrameFooter></FrameFooter></Frame>';
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });
  it("入れ子になった対象要素も全てリネームされる", () => {
    const input = [
      '<TableFrame>',
      '  <TableHeader>',
      '    <TablePageHeader>',
      '      <TableFooter></TableFooter>',
      '    </TablePageHeader>',
      '  </TableHeader>',
      '</TableFrame>'].join('\n');
    const expected = [
      '<Frame>',
      '  <FrameHeader>',
      '    <FramePageHeader>',
      '      <FrameFooter></FrameFooter>',
      '    </FramePageHeader>',
      '  </FrameHeader>',
      '</Frame>'].join('\n');
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });
});
