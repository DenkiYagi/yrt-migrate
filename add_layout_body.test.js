import { migrate } from "./add_layout_body.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

describe("add_layout_body", () => {
  function normalize(xml) {
    // XML文字列を正規化して比較
    // 空要素の省略記法 <tag/> を <tag></tag> に統一
    return xml
      .replace(/\s+/g, "")
      .replace(/<([a-zA-Z0-9_:-]+)\/>/g, '<$1></$1>');
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
    const yrtRoot = toYrtRoot({ layouts: [input] });
    const migrated = migrate(yrtRoot);
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
    const yrtRoot = toYrtRoot({ layouts: [input] });
    const migrated = migrate(yrtRoot);
    const { layouts } = fromYrtRoot(migrated);
    const migratedXml = layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(expected));
  });

  it("<LinearLayout> 直下に何もない場合は何もしない", () => {
    const input = `<LinearLayout></LinearLayout>`;
    const yrtRoot = toYrtRoot({ layouts: [input] });
    const migrated = migrate(yrtRoot);
    const { layouts } = fromYrtRoot(migrated);
    const migratedXml = layouts[0];
    expect(normalize(migratedXml)).toBe(normalize(input));
  });
});
