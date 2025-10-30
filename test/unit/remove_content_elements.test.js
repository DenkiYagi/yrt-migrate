import { migrate } from "../../src/migrate/remove_content_elements.mjs";

describe('remove_content_elements マイグレーション', () => {
  test.each([
    {
      name: "TextContentがなければ何もしない",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>',
        '    </Text>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>',
        '    </Text>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "TextContentがなければ何もしない",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>',
        '      foo',
        '    </Text>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>',
        '      foo',
        '    </Text>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "TextContentが空だった場合はそのまま削除される",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>',
        '      <TextContent></TextContent>',
        '    </Text>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text/>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "TextContentの前後に空白があっても、中身が空ならそのまま削除される",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>  <TextContent></TextContent>  </Text>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text/>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "TextContentの中身がそのままText要素の子ノードになる",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>',
        '      <TextContent>foo</TextContent>',
        '    </Text>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>foo</Text>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "VTextContentの中身がそのままVText要素の子ノードになる",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <VText>',
        '      <VTextContent>foo</VTextContent>',
        '    </VText>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <VText>foo</VText>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "LinkContentの中身がそのままLink要素の子ノードになる",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Link to="https://example.com">',
        '      <LinkContent>foo</LinkContent>',
        '    </Link>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Link to="https://example.com">foo</Link>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "RichTextContentの中身がそのままRichText要素の子ノードになる",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <RichText>',
        '      <RichTextContent>foo</RichTextContent>',
        '    </RichText>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <RichText>foo</RichText>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "ColumnTextContentの中身がそのままColumnText要素の子ノードになる",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <ColumnText>',
        '      <ColumnTextContent>foo</ColumnTextContent>',
        '    </ColumnText>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <ColumnText>foo</ColumnText>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "複数ある場合(1)",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>',
        '      <TextContent>foo</TextContent>',
        '      <TextContent>bar</TextContent>',
        '    </Text>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>foobar</Text>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "複数ある場合(2)",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <RichText>',
        '      <RichTextContent>foo</RichTextContent>',
        '      <Span>bar</Span>',
        '    </RichText>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <RichText>foo<Span>bar</Span></RichText>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "XxxContent内の前後ホワイトスペースはトリミングされない",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>',
        '      <TextContent>  ABC  </TextContent>',
        '    </Text>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>  ABC  </Text>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
    {
      name: "TextContent内の前後ホワイトスペースはトリミングされない（改行・インデントあり）",
      input: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>',
        '      <TextContent>  ABC',
        '      DEF  </TextContent>',
        '    </Text>',
        '  </LayoutBody>',
        '</LinearLayout>'],
      expected: [
        '<LinearLayout>',
        '  <LayoutBody>',
        '    <Text>  ABC',
        '      DEF  </Text>',
        '  </LayoutBody>',
        '</LinearLayout>']
    },
  ])('$name', ({ input, expected }) => {
    const inputXml = Array.isArray(input) ? input.join('\n') : input;
    const expectedXml = Array.isArray(expected) ? expected.join('\n') : expected;
    const yrtDocument = { layouts: [inputXml], style: null };
    const migrated = migrate(yrtDocument);
    const migratedXml = migrated.layouts[0];
    expect(migratedXml).toBe(expectedXml);
  });
});
