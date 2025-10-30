import { migrate } from "../../src/migrate/add_layout_body.mjs";

describe("add_layout_body", () => {
  function normalize(xml) {
    // XML文字列を正規化して比較
    // 空要素の省略記法 <tag/> を <tag></tag> に統一
    return xml
      .replace(/\s+/g, "")
      .replace(/<([a-zA-Z0-9_:-]+)\/>/g, '<$1></$1>');
  }

  it("<LinearLayout> 直下に何もない場合は <LayoutBody> だけを追加する", () => {
    const input = "<LinearLayout></LinearLayout>";
    const expected = "<LinearLayout><LayoutBody></LayoutBody></LinearLayout>";
    const inputXml = [input].join('\n');
    const yrtDocument = { layouts: [inputXml], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("自己終了タグの <LinearLayout/> にも <LayoutBody> を追加する", () => {
    const input = "<LinearLayout/>";
    const expected = "<LinearLayout><LayoutBody></LayoutBody></LinearLayout>";
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    expect(normalize(migrated.layouts[0])).toBe(normalize(expected));
  });

  it("<LinearLayout> 直下に <LayoutBody> が既にある場合は何もしない", () => {
    const input = [
      '<LinearLayout>',
      '  <LayoutHeader>header</LayoutHeader>',
      '  <LayoutBody>',
      '    <Text>body</Text>',
      '  </LayoutBody>',
      '  <LayoutFooter>footer</LayoutFooter>',
      '</LinearLayout>'].join('\n');
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(input));
  });

  it("<LinearLayout> 直下に <LayoutHeader> や <LayoutFooter>だけがある場合は、それらを除外して <LayoutBody> を追加する", () => {
    const input = [
      '<LinearLayout>',
      '  <LayoutHeader>header</LayoutHeader>',
      '  <LayoutFooter>footer</LayoutFooter>',
      '</LinearLayout>'].join('\n');
    const expected = [
      '<LinearLayout>',
      '    <LayoutHeader>header</LayoutHeader>',
      '    <LayoutBody></LayoutBody>',
      '    <LayoutFooter>footer</LayoutFooter>',
      '</LinearLayout>'].join('\n');
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("<LinearLayout> 直下に LayoutXxx 系ではない要素があった場合は、エラーを投げる", () => {
    const input = [
      '<LinearLayout>',
      '  <LayoutHeader>header</LayoutHeader>',
      '  <Text>body</Text>',
      '  <LayoutFooter>footer</LayoutFooter>',
      '</LinearLayout>'].join('\n');
    const yrtDocument = { layouts: [input], style: null };
    expect(() => migrate(yrtDocument)).toThrow(/unexpected child element/i);
  });

  it("LayoutBody の追加前後で LinearLayout の子要素の前後のホワイトスペースを変化させない", () => {
    const xml = [
      '<LinearLayout>',
      '',
      '  <LayoutHeader height="10">',
      '    <Text>header</Text>',
      '  </LayoutHeader>',
      '',
      '  <LayoutBody>',
      '',
      '    <Text>Line 1',
      '  Line 2 (indent: 2 spaces)</Text>',
      '',
      '  </LayoutBody>',
      '',
      '</LinearLayout>'].join('\n');
    const input = xml;
    const expected = xml;
    const yrtDocument = { layouts: [input], style: null };
    const migrated = migrate(yrtDocument);
    expect(migrated.layouts[0]).toBe(expected);
  })
});
