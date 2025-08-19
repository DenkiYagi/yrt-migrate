import { migrate } from "./add_layout_body.mjs";
import { jest } from '@jest/globals';
import { toYrtRoot, fromYrtRoot } from "./utils.js";

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
    const migrated = migrate(toYrtRoot({ layouts: [input] }));
    const { layouts } = fromYrtRoot(migrated);
    const migratedXml = layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
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
    const yrtRoot = toYrtRoot({ layouts: [input] });
    const migrated = migrate(yrtRoot);
    const { layouts } = fromYrtRoot(migrated);
    const migratedXml = layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(input));
  });

  it("<LinearLayout> 直下に <LayoutHeader> や <LayoutFooter>だけがある場合は、それらを除外して <LayoutBody> を追加する", () => {
    const input = `
<LinearLayout>
  <LayoutHeader>header</LayoutHeader>
  <LayoutFooter>footer</LayoutFooter>
</LinearLayout>
`;
    const expected = `
<LinearLayout>
    <LayoutHeader>header</LayoutHeader>
    <LayoutBody></LayoutBody>
    <LayoutFooter>footer</LayoutFooter>
</LinearLayout>
`;
    const yrtRoot = toYrtRoot({ layouts: [input] });
    const migrated = migrate(yrtRoot);
    const { layouts } = fromYrtRoot(migrated);
    const migratedXml = layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("<LinearLayout> 直下に LayoutXxx 系ではない要素があった場合は、警告だけ出して 後ろに並ぶようにする", () => {
    const input = `
<LinearLayout>
  <LayoutHeader>header</LayoutHeader>
  <Text>body</Text>
  <LayoutFooter>footer</LayoutFooter>
</LinearLayout>
`;
    const expected = `
<LinearLayout>
  <LayoutHeader>header</LayoutHeader>
  <LayoutBody></LayoutBody>
  <LayoutFooter>footer</LayoutFooter>
  <Text>body</Text>
</LinearLayout>
`;
    const yrtRoot = toYrtRoot({ layouts: [input] });
    // 警告の監視
    const warnMock = jest.spyOn(console, "warn").mockImplementation(() => { });
    const migrated = migrate(yrtRoot);
    const { layouts } = fromYrtRoot(migrated);
    // LayoutBodyが追加されていること
    expect(normalize(layouts[0])).toBe(normalize(expected));
    // 警告が出ていることのみチェック
    expect(warnMock).toHaveBeenCalled();
    warnMock.mockRestore();
  });
});
