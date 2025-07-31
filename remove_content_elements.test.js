import { migrate } from "./remove_content_elements.mjs";
import { toYrtRoot, fromYrtRoot } from "./utils.js";

function normalizeXml(xml) {
  xml = xml.replace(/>\s+</g, "><");
  xml = xml.replace(/([^<>]+)(?=<|$)/g, (s) => s.replace(/\s+/g, " ").trim());
  xml = xml.trim();
  xml = xml.replace(
    /<([a-zA-Z0-9_:-]+)\s*\/>/g,
    (m, tag) => `<${tag}></${tag}>`
  );
  return xml;
}

describe('remove_content_elements マイグレーション', () => {
  test.each([
    // 1. 空要素の除去
    {
      name: "空要素のみ（VTextContent）",
      input: `<LinearLayout><LayoutBody><Text><VTextContent></VTextContent></Text></LayoutBody></LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text></Text></LayoutBody></LinearLayout>`
    },
    {
      name: "空要素＋前後に空白（TextContent）",
      input: `<LinearLayout><LayoutBody><Text>  <TextContent> </TextContent>  </Text></LayoutBody></LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text></Text></LayoutBody></LinearLayout>`
    },

    // 2. 多重入れ子（深いネスト）
    {
      name: "多重入れ子（VTextContent→LinkContent→RichTextContent）",
      input: `<LinearLayout><LayoutBody><Text><VTextContent><LinkContent><RichTextContent>deep</RichTextContent></LinkContent></VTextContent></Text></LayoutBody></LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text>deep</Text></LayoutBody></LinearLayout>`
    },
    {
      name: "TextContent多重入れ子・インデントあり",
      input: `<LinearLayout>
      <LayoutBody>
        <Text>
          <TextContent>
            <VTextContent>
              <LinkContent>deep</LinkContent>
            </VTextContent>
          </TextContent>
        </Text>
      </LayoutBody>
    </LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text>deep</Text></LayoutBody></LinearLayout>`
    },

    // 3. 複数XxxContentの並列・ネスト展開
    {
      name: "複数XxxContent並列（VTextContent, LinkContent, RichTextContent）",
      input: `<LinearLayout><LayoutBody><Text><VTextContent>foo</VTextContent><LinkContent>bar</LinkContent><RichTextContent>baz</RichTextContent></Text></LayoutBody></LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text>foobarbaz</Text></LayoutBody></LinearLayout>`
    },
    {
      name: "TextContent内に複数XxxContentのネスト",
      input: `<LinearLayout><LayoutBody><Text><TextContent><VTextContent>foo</VTextContent><LinkContent>bar</LinkContent></TextContent></Text></LayoutBody></LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text>foobar</Text></LayoutBody></LinearLayout>`
    },

    // 4. XxxContentと他要素混在（スキーマ準拠: Spanのみ）
    {
      name: "XxxContentとSpan混在",
      input: `<LinearLayout><LayoutBody><Text><VTextContent>foo</VTextContent><Span>span</Span><LinkContent>bar</LinkContent></Text></LayoutBody></LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text>foo<Span>span</Span>bar</Text></LayoutBody></LinearLayout>`
    },
    {
      name: "TextContentとSpan混在",
      input: `<LinearLayout><LayoutBody><Text><TextContent>foo</TextContent><Span>span</Span></Text></LayoutBody></LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text>foo<Span>span</Span></Text></LayoutBody></LinearLayout>`
    },

    // 5. ホワイトスペース正規化
    {
      name: "タグ間スペース混在（TextContent）",
      input: `<LinearLayout><LayoutBody><Text> <TextContent>  abc  </TextContent> <Span>  xyz  </Span> </Text></LayoutBody></LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text>abc<Span>xyz</Span></Text></LayoutBody></LinearLayout>`
    },
    {
      name: "改行・インデントあり（VTextContent, LinkContent）",
      input: `<LinearLayout>
      <LayoutBody>
        <Text>
          <VTextContent>
            foo
            <LinkContent>bar</LinkContent>
          </VTextContent>
        </Text>
      </LayoutBody>
    </LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text>foo bar</Text></LayoutBody></LinearLayout>`
    },
    {
      name: "TextContent改行・インデントあり（複数XxxContent）",
      input: `<LinearLayout>
      <LayoutBody>
        <Text>
          <TextContent>
            foo
            <VTextContent>bar</VTextContent>
            <LinkContent>baz</LinkContent>
          </TextContent>
        </Text>
      </LayoutBody>
    </LinearLayout>`,
      expected: `<LinearLayout><LayoutBody><Text>foo bar baz</Text></LayoutBody></LinearLayout>`
    },
  ])('$name', ({ input, expected }) => {
    // YRT構造に変換
    const yrtRoot = toYrtRoot({ layouts: [input] });
    const migrated = migrate(yrtRoot);
    // YRT構造からXML配列を抽出
    const { layouts } = fromYrtRoot(migrated);
    const migratedXml = layouts[0];
    expect(normalizeXml(migratedXml)).toBe(normalizeXml(expected));
  });
});
