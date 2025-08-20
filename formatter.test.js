import { jest } from "@jest/globals";
import { removeIndents } from "./formatter.mjs";

describe("removeIndents", () => {
    it("典型ケース: 2行目以降の全行が余分なインデントを持つ", () => {
        const input = [
            '<LinearLayout>',
            '    <LayoutBody>',
            '      <Text>text</Text>',
            '    </LayoutBody>',
            '  </LinearLayout>'
        ].join('\n');
        const expected = [
            '<LinearLayout>',
            '  <LayoutBody>',
            '    <Text>text</Text>',
            '  </LayoutBody>',
            '</LinearLayout>'
        ].join('\n');
        expect(removeIndents(input)).toBe(expected);
    });

    it("1行目以外にインデント0の行（除外対象ではないもの）があれば、全てのインデントは削除されない", () => {
        const input = [
            '<LinearLayout>',
            '    <LayoutBody>',
            '<Text>text</Text>', // the minimum indentation is 0 due to this line
            '    </LayoutBody>',
            '  </LinearLayout>'
        ].join('\n');
        const expected = [
            '<LinearLayout>',
            '    <LayoutBody>',
            '<Text>text</Text>',
            '    </LayoutBody>',
            '  </LinearLayout>'
        ].join('\n');
        expect(removeIndents(input)).toBe(expected);
    });

    it("空行は無視される", () => {
        const input = [
            '<LinearLayout>',
            '',
            '    <LayoutBody>',
            '      <Text>text</Text>',
            '    </LayoutBody>',
            '',
            '  </LinearLayout>'
        ].join('\n');
        const expected = [
            '<LinearLayout>',
            '',
            '  <LayoutBody>',
            '    <Text>text</Text>',
            '  </LayoutBody>',
            '',
            '</LinearLayout>'
        ].join('\n');
        expect(removeIndents(input)).toBe(expected);
    });

    it("空白文字のみの行はトリムされる", () => {
        const input = [
            '<LinearLayout>',
            '        ',
            '    <LayoutBody>',
            '      <Text>text</Text>',
            '    </LayoutBody>',
            '        ',
            '  </LinearLayout>'
        ].join('\n');
        const expected = [
            '<LinearLayout>',
            '',
            '  <LayoutBody>',
            '    <Text>text</Text>',
            '  </LayoutBody>',
            '',
            '</LinearLayout>'
        ].join('\n');
        expect(removeIndents(input)).toBe(expected);
    });

    it("タブが含まれる場合は 2 spaces に変換され、警告が出力される", () => {
        const input = [
            '<LinearLayout>',
            '\t\t<LayoutBody>',
            '\t\t\t<Text>text</Text>',
            '\t\t</LayoutBody>',
            '\t</LinearLayout>'
        ].join('\n');
        const expected = [
            '<LinearLayout>',
            '  <LayoutBody>',
            '    <Text>text</Text>',
            '  </LayoutBody>',
            '</LinearLayout>'
        ].join('\n');
        // 警告が出ることも確認
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        expect(removeIndents(input)).toBe(expected);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('TAB文字が検出されました'));
        warnSpy.mockRestore();
    });

    it("インデントがバラバラでも最小値だけ除去される", () => {
        const input = [
            '<LinearLayout>',
            '    <LayoutBody>',
            '      <Text>text</Text>',
            '        <Text>more</Text>',
            '    </LayoutBody>',
            '  </LinearLayout>'
        ].join('\n');
        const expected = [
            '<LinearLayout>',
            '  <LayoutBody>',
            '    <Text>text</Text>',
            '      <Text>more</Text>',
            '  </LayoutBody>',
            '</LinearLayout>'
        ].join('\n');
        expect(removeIndents(input)).toBe(expected);
    });

    it("要素内で同行内の空白は保持される", () => {
        const input = [
            '<LinearLayout>',
            '    <LayoutBody>',
            '      <Text>   text</Text>',
            '    </LayoutBody>',
            '  </LinearLayout>'
        ].join('\n');
        const expected = [
            '<LinearLayout>',
            '  <LayoutBody>',
            '    <Text>   text</Text>',
            '  </LayoutBody>',
            '</LinearLayout>'
        ].join('\n');
        expect(removeIndents(input)).toBe(expected);
    });

    describe("行の最初の非空白文字がXMLタグではないか、またはテキスト系要素 (Text, Link, VText, RichText, Span) の終了タグであるとき、その行は無視される", () => {
        it("Text内容の先頭で改行", () => {
            const input = [
                '<LinearLayout>',
                '    <LayoutBody>',
                '      <Text>',
                'text</Text>', // ignore this line when detecting minimum indentation
                '    </LayoutBody>',
                '  </LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Text>',
                'text</Text>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            expect(removeIndents(input)).toBe(expected);
        });
        it("Text内容の先頭で改行+インデント", () => {
            const input = [
                '<LinearLayout>',
                '      <LayoutBody>',
                '        <Text>',
                '  text</Text>', // ignore this line when detecting minimum indentation, and keep this indent AS-IS
                '      </LayoutBody>',
                '    </LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Text>',
                '  text</Text>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            expect(removeIndents(input)).toBe(expected);
        });
        it("Text内容の末尾で改行", () => {
            const input = [
                '<LinearLayout>',
                '    <LayoutBody>',
                '      <Text>text',
                '</Text>', // ignore this line when detecting minimum indentation
                '    </LayoutBody>',
                '  </LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Text>text',
                '</Text>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            expect(removeIndents(input)).toBe(expected);
        });
        it("Text内容の末尾で改行+インデント", () => {
            const input = [
                '<LinearLayout>',
                '      <LayoutBody>',
                '        <Text>text',
                '  </Text>', // ignore this line when detecting minimum indentation, and keep this indent AS-IS
                '      </LayoutBody>',
                '    </LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Text>text',
                '  </Text>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            expect(removeIndents(input)).toBe(expected);
        });
        it("先頭・末尾改行", () => {
            const input = [
                '<LinearLayout>',
                '    <LayoutBody>',
                '      <Text>',
                'text', // ignore this line when detecting minimum indentation
                '</Text>', // same here
                '    </LayoutBody>',
                '  </LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Text>',
                'text',
                '</Text>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            expect(removeIndents(input)).toBe(expected);
        });
        it("先頭・末尾改行+中身が複数行(インデントあり)", () => {
            const input = [
                '<LinearLayout>',
                '    <LayoutBody>',
                '      <Text>',
                '  foo', // ignore this line when detecting minimum indentation, and keep this indent AS-IS
                '  bar', // same here
                '      </Text>', // same here
                '    </LayoutBody>',
                '  </LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Text>',
                '  foo',
                '  bar',
                '      </Text>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            expect(removeIndents(input)).toBe(expected);
        });

        it("Link要素の終了タグは無視される", () => {
            const input = [
                '<LinearLayout>',
                '    <LayoutBody>',
                '      <Link>link text',
                '</Link>', // ignore this line when detecting minimum indentation
                '    </LayoutBody>',
                '  </LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <Link>link text',
                '</Link>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            expect(removeIndents(input)).toBe(expected);
        });

        it("VText要素の終了タグは無視される", () => {
            const input = [
                '<LinearLayout>',
                '    <LayoutBody>',
                '      <VText>vertical text',
                '</VText>', // ignore this line when detecting minimum indentation
                '    </LayoutBody>',
                '  </LinearLayout>'
            ].join('\n');
            const expected = [
                '<LinearLayout>',
                '  <LayoutBody>',
                '    <VText>vertical text',
                '</VText>',
                '  </LayoutBody>',
                '</LinearLayout>'
            ].join('\n');
            expect(removeIndents(input)).toBe(expected);
        });

        describe("RichText要素のmixed contentパターン", () => {
            it("RichText内のテキストノードは無視される", () => {
                const input = [
                    '<LinearLayout>',
                    '    <LayoutBody>',
                    '      <RichText>',
                    'plain text', // ignore this line when detecting minimum indentation
                    '      </RichText>', // ignore this line when detecting minimum indentation, and keep this indent AS-IS
                    '    </LayoutBody>',
                    '  </LinearLayout>'
                ].join('\n');
                const expected = [
                    '<LinearLayout>',
                    '  <LayoutBody>',
                    '    <RichText>',
                    'plain text',
                    '      </RichText>',
                    '  </LayoutBody>',
                    '</LinearLayout>'
                ].join('\n');
                expect(removeIndents(input)).toBe(expected);
            });

            it("RichText内のSpan要素の終了タグは無視される", () => {
                const input = [
                    '<LinearLayout>',
                    '    <LayoutBody>',
                    '      <RichText>text<Span>span text',
                    '</Span>more text</RichText>', // ignore this line when detecting minimum indentation
                    '    </LayoutBody>',
                    '  </LinearLayout>'
                ].join('\n');
                const expected = [
                    '<LinearLayout>',
                    '  <LayoutBody>',
                    '    <RichText>text<Span>span text',
                    '</Span>more text</RichText>',
                    '  </LayoutBody>',
                    '</LinearLayout>'
                ].join('\n');
                expect(removeIndents(input)).toBe(expected);
            });

            it("RichText内の複雑なmixed content", () => {
                const input = [
                    '<LinearLayout>',
                    '    <LayoutBody>',
                    '      <RichText>',
                    'start text', // ignore this line
                    '        <Span>',
                    'span text', // ignore this line
                    '          <Span>nested span',
                    '</Span>', // ignore this line
                    'more span text', // ignore this line
                    '        </Span>', // ignore this line
                    'end text', // ignore this line
                    '      </RichText>', // ignore this line
                    '    </LayoutBody>',
                    '  </LinearLayout>'
                ].join('\n');
                const expected = [
                    '<LinearLayout>',
                    '  <LayoutBody>',
                    '    <RichText>',
                    'start text',
                    '      <Span>',
                    'span text',
                    '        <Span>nested span',
                    '</Span>',
                    'more span text',
                    '        </Span>',
                    'end text',
                    '      </RichText>',
                    '  </LayoutBody>',
                    '</LinearLayout>'
                ].join('\n');
                expect(removeIndents(input)).toBe(expected);
            });

            it("RichText終了タグ単体も無視される", () => {
                const input = [
                    '<LinearLayout>',
                    '    <LayoutBody>',
                    '      <RichText>rich content',
                    '</RichText>', // ignore this line when detecting minimum indentation
                    '    </LayoutBody>',
                    '  </LinearLayout>'
                ].join('\n');
                const expected = [
                    '<LinearLayout>',
                    '  <LayoutBody>',
                    '    <RichText>rich content',
                    '</RichText>',
                    '  </LayoutBody>',
                    '</LinearLayout>'
                ].join('\n');
                expect(removeIndents(input)).toBe(expected);
            });
        });

        describe("Span要素のネストパターン", () => {
            it("Span終了タグ単体は無視される", () => {
                const input = [
                    '<LinearLayout>',
                    '    <LayoutBody>',
                    '      <RichText><Span>content',
                    '</Span></RichText>', // ignore this line when detecting minimum indentation
                    '    </LayoutBody>',
                    '  </LinearLayout>'
                ].join('\n');
                const expected = [
                    '<LinearLayout>',
                    '  <LayoutBody>',
                    '    <RichText><Span>content',
                    '</Span></RichText>',
                    '  </LayoutBody>',
                    '</LinearLayout>'
                ].join('\n');
                expect(removeIndents(input)).toBe(expected);
            });

            it("深くネストしたSpan要素", () => {
                const input = [
                    '<LinearLayout>',
                    '    <LayoutBody>',
                    '      <RichText>',
                    'text1', // ignore this line
                    '        <Span>',
                    'text2', // ignore this line
                    '          <Span>',
                    'text3', // ignore this line
                    '            <Span>deep content',
                    '</Span>', // ignore this line
                    'text4', // ignore this line
                    '          </Span>', // ignore this line
                    'text5', // ignore this line
                    '        </Span>', // ignore this line
                    'text6', // ignore this line
                    '      </RichText>', // ignore this line
                    '    </LayoutBody>',
                    '  </LinearLayout>'
                ].join('\n');
                const expected = [
                    '<LinearLayout>',
                    '  <LayoutBody>',
                    '    <RichText>',
                    'text1',
                    '      <Span>',
                    'text2',
                    '        <Span>',
                    'text3',
                    '          <Span>deep content',
                    '</Span>',
                    'text4',
                    '          </Span>',
                    'text5',
                    '        </Span>',
                    'text6',
                    '      </RichText>',
                    '  </LayoutBody>',
                    '</LinearLayout>'
                ].join('\n');
                expect(removeIndents(input)).toBe(expected);
            });

            it("Span要素内でのテキストとSpanの組み合わせ", () => {
                const input = [
                    '<LinearLayout>',
                    '    <LayoutBody>',
                    '      <RichText>start<Span>before<Span>middle',
                    '</Span>after</Span>end</RichText>', // ignore this line
                    '    </LayoutBody>',
                    '  </LinearLayout>'
                ].join('\n');
                const expected = [
                    '<LinearLayout>',
                    '  <LayoutBody>',
                    '    <RichText>start<Span>before<Span>middle',
                    '</Span>after</Span>end</RichText>',
                    '  </LayoutBody>',
                    '</LinearLayout>'
                ].join('\n');
                expect(removeIndents(input)).toBe(expected);
            });

            it("複数のSpan要素が並列に存在するパターン", () => {
                const input = [
                    '<LinearLayout>',
                    '    <LayoutBody>',
                    '      <RichText>',
                    'start', // ignore this line
                    '        <Span>first span',
                    '</Span>', // ignore this line
                    'middle', // ignore this line
                    '        <Span>second span',
                    '</Span>', // ignore this line
                    'end', // ignore this line
                    '      </RichText>', // ignore this line
                    '    </LayoutBody>',
                    '  </LinearLayout>'
                ].join('\n');
                const expected = [
                    '<LinearLayout>',
                    '  <LayoutBody>',
                    '    <RichText>',
                    'start',
                    '      <Span>first span',
                    '</Span>',
                    'middle',
                    '      <Span>second span',
                    '</Span>',
                    'end',
                    '      </RichText>',
                    '  </LayoutBody>',
                    '</LinearLayout>'
                ].join('\n');
                expect(removeIndents(input)).toBe(expected);
            });
        });
    });

    it("全て空行や1行だけならそのまま返す", () => {
        expect(removeIndents('')).toBe('');
        expect(removeIndents('\n')).toBe('\n');
        expect(removeIndents('<LinearLayout/>')).toBe('<LinearLayout/>');
    });
});
