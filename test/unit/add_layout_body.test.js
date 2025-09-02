import { jest } from '@jest/globals';
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
    const yrtDocument = { layouts: [{ name: null, xml: inputXml }], style: null, assets: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0].xml;
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("<LinearLayout> 直下に <LayoutBody> が既にある場合は何もしない", () => {
    const input = [
      '<LinearLayout>',
      '  <LayoutHeader>header</LayoutHeader>',
      '  <LayoutBody>',
      '    <Text>body</Text>',
      '  </LayoutBody>',
      '  <LayoutFooter>footer</LayoutFooter>',
      '</LinearLayout>'
    ].join('\n');
    const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0].xml;
    expect(normalize(migratedXml)).toBe(normalize(input));
  });

  it("<LinearLayout> 直下に <LayoutHeader> や <LayoutFooter>だけがある場合は、それらを除外して <LayoutBody> を追加する", () => {
    const input = [
      '<LinearLayout>',
      '  <LayoutHeader>header</LayoutHeader>',
      '  <LayoutFooter>footer</LayoutFooter>',
      '</LinearLayout>'
    ].join('\n');
    const expected = [
      '<LinearLayout>',
      '    <LayoutHeader>header</LayoutHeader>',
      '    <LayoutBody></LayoutBody>',
      '    <LayoutFooter>footer</LayoutFooter>',
      '</LinearLayout>'
    ].join('\n');
    const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0].xml;
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("<LinearLayout> 直下に LayoutXxx 系ではない要素があった場合は、警告だけ出して 後ろに並ぶようにする", () => {
    const input = [
      '<LinearLayout>',
      '  <LayoutHeader>header</LayoutHeader>',
      '  <Text>body</Text>',
      '  <LayoutFooter>footer</LayoutFooter>',
      '</LinearLayout>'
    ].join('\n');
    const expected = [
      '<LinearLayout>',
      '  <LayoutHeader>header</LayoutHeader>',
      '  <LayoutBody></LayoutBody>',
      '  <LayoutFooter>footer</LayoutFooter>',
      '  <Text>body</Text>',
      '</LinearLayout>'
    ].join('\n');
    const yrtDocument = { layouts: [{ name: null, xml: input }], style: null, assets: null };
    // 警告の監視
    const warnMock = jest.spyOn(console, "warn").mockImplementation(() => { });
    const migrated = migrate(yrtDocument);
    // LayoutBodyが追加されていること
    expect(normalize(migrated.layouts[0].xml)).toBe(normalize(expected));
    // 警告が出ていることのみチェック
    expect(warnMock).toHaveBeenCalled();
    warnMock.mockRestore();
  });
});
