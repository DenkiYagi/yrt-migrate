// remove_content_elements.test.js
// <XxxContent>系要素除去のテスト
import { strict as assert } from "assert";
import { DOMParser, XMLSerializer } from "xmldom";
import { migrate } from "./remove_content_elements.mjs";

function normalizeXml(xml) {
    // 空白・改行を除去して比較しやすくする（タグ間・テキストノード内両方）
    xml = xml.replace(/>\s+</g, "><");
    // テキストノード内の連続空白・改行を1つのスペースに、かつ先頭・末尾の空白もトリム
    xml = xml.replace(/([^<>]+)(?=<|$)/g, s => s.replace(/\s+/g, " ").trim());
    xml = xml.trim();
    // <tag/> → <tag></tag> に正規化（self-closingのみ）
    xml = xml.replace(
        /<([a-zA-Z0-9_:-]+)\s*\/>/g,
        (m, tag) => `<${tag}></${tag}>`
    );
    return xml;
}

function testCase(name, input, expected) {
    const doc = new DOMParser().parseFromString(input, "text/xml");
    migrate(doc, {}); // yrtRootは使わない
    const output = new XMLSerializer().serializeToString(doc.documentElement);
    assert.equal(normalizeXml(output), normalizeXml(expected), name);
    console.log("✔", name);
}

// ...existing code...
testCase(
    "単純なTextContent",
    `<Root><TextContent>abc</TextContent></Root>`,
    `<Root>abc</Root>`
);

testCase(
    "ネストしたXxxContent",
    `<Root><TextContent><VTextContent>foo</VTextContent><LinkContent>bar</LinkContent></TextContent></Root>`,
    `<Root>foobar</Root>`
);

testCase(
    "XxxContentの中に他要素",
    `<Root><TextContent><b>bold</b><i>italic</i></TextContent></Root>`,
    `<Root><b>bold</b><i>italic</i></Root>`
);

testCase(
    "XxxContentの多重入れ子",
    `<Root><TextContent><VTextContent><LinkContent>deep</LinkContent></VTextContent></TextContent></Root>`,
    `<Root>deep</Root>`
);

testCase(
    "XxxContent以外はそのまま",
    `<Root><Other>keep</Other><TextContent>remove</TextContent></Root>`,
    `<Root><Other>keep</Other>remove</Root>`
);

testCase(
    "XxxContentが存在しない",
    `<Root><Other>keep</Other></Root>`,
    `<Root><Other>keep</Other></Root>`
);

testCase(
    "空のXxxContent",
    `<Root><TextContent></TextContent></Root>`,
    `<Root></Root>`
);

testCase(
    "改行・インデントあり",
    `<Root>
    <TextContent>
      foo
      <VTextContent>bar</VTextContent>
      <LinkContent>baz</LinkContent>
    </TextContent>
  </Root>`,
    `<Root>foo bar baz</Root>`
);

testCase(
    "タグ間スペース混在",
    `<Root> <TextContent>  abc  </TextContent> <Other>  xyz  </Other> </Root>`,
    `<Root>abc<Other>xyz</Other></Root>`
);

testCase(
    "空要素の前後に空白",
    `<Root>  <TextContent> </TextContent>  </Root>`,
    `<Root></Root>`
);

testCase(
    "多重入れ子・インデントあり",
    `<Root>
    <TextContent>
      <VTextContent>
        <LinkContent>deep</LinkContent>
      </VTextContent>
    </TextContent>
  </Root>`,
    `<Root>deep</Root>`
);
