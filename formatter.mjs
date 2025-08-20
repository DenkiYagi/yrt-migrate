import xmlFormat from "xml-formatter";

/**
 * xml-formatter を使って2スペースインデントで整形します。
 *
 * 主に StyleXML に対して使用します。
 * LayoutXML にはこの関数ではなく `removeIndents()` のほうを使用してください。
 * 
 * @param {string} xml XML文字列
 * @returns {string} 整形済みXML
 */
export function formatXmlPretty(xml) {
    return xmlFormat(xml, {
        indentation: "  ",
        lineSeparator: "\n",
        whiteSpaceAtEndOfSelfclosingTag: true,
    });
}

/**
 * 与えられたXML文字列について、2行目以降の共通インデントを除去することで整形します。
 *
 * ### 背景
 * 本プロジェクトには、DOM操作によってXMLのルートノードを削除する処理があります。
 * しかしその結果を serialize すると、1行目だけが行の先頭に来て、2行目以降は元のXMLのインデントが残ります。
 * これを整形する必要がありますが、一部のテキスト系要素（`<Text>` など）は whitespace-sensitive であるため、
 * 不要なインデントだけを慎重に除去する必要があります。
 *
 * ### 仕様
 * - すべてのタブ文字を2スペースに変換します。
 *   タブが検出された場合は警告を出力します。
 * - 各行の先頭スペース数の最小値を検出し、その分だけ各行の先頭スペースを除去します。
 *   これにより、元の相対インデントは維持されます。
 *   ただし、下記の条件にあてはまる行は、最小値の検出においても先頭スペース除去においても無視します:
 *   - 全体の最初の行
 *   - 空行または空白文字のみである
 *   - 行の最初の非空白文字が、開始ブラケット `<` ではない
 *   - 行の最初の非空白文字列が、テキスト系要素 (Text, Link, VText, RichText, Span) の終了タグで始まる
 *
 * @param {string} xml XML文字列
 * @returns {string} インデント除去・タブ正規化済みXML文字列
 */
export function removeIndents(xml) {
    // タブを2スペースに変換
    if (xml.includes('\t')) {
        console.warn(`[WARNING] TAB文字が検出されました。半角スペースx2 に変換します。`);
        xml = xml.replace(/\t/g, '  ');
    }
    const lines = xml.split('\n');

    // エッジケース: 空文字列、1行のみの場合はそのまま返す
    if (lines.length <= 1) {
        return xml;
    }

    // 空白文字のみの行をトリム
    const processedLines = lines.map((line) => {
        if (line.trim() === '') return '';
        return line;
    });

    // 最小インデント数を検出（1行目と除外条件の行以外から）
    let minIndent = Infinity;
    for (let i = 1; i < processedLines.length; i++) {
        const line = processedLines[i];
        if (shouldIgnoreForIndentDetection(line)) continue;
        const indentCount = getLeadingSpaceCount(line);
        minIndent = Math.min(minIndent, indentCount);
    }

    // 有効な最小インデントが見つからない場合はそのまま返す
    if (minIndent === Infinity) {
        return processedLines.join('\n');
    }

    // 各行から最小インデント分を除去
    const result = processedLines.map((line, index) => {
        if (index === 0 || shouldIgnoreForIndentDetection(line)) {
            return line;
        }
        if (line.length >= minIndent) {
            return line.slice(minIndent);
        }
        return line;
    });

    return result.join('\n');
}

/**
 * テキスト系要素（テキストノードを内容に持ちうる要素）のリスト。
 * ※ ColumnText はそもそも改行を含むことがありえないため除外
 * 
 * @see isTextElementEndTag
 */
const textLikeElementNames = ['Text', 'Link', 'VText', 'RichText', 'Span'];

/**
 * テキスト系要素の終了タグで始まるかどうかを判定
 * @param {string} trimmedLine トリム済みの行
 * @returns {boolean}
 */
function isTextElementEndTag(trimmedLine) {
    return textLikeElementNames.some(element => trimmedLine.startsWith(`</${element}>`));
}

/**
 * インデント検出において無視すべき行かどうかを判定
 * @param {string} line 行文字列
 * @returns {boolean}
 */
function shouldIgnoreForIndentDetection(line) {
    const trimmed = line.trim();

    // 空行または空白文字のみの行なら無視
    if (trimmed === '') return true;

    // 行の最初の非空白文字が開始ブラケットではないなら無視
    if (!trimmed.startsWith('<')) return true;

    // 行の最初の非空白文字列がテキスト系要素の終了タグで始まるなら無視
    if (isTextElementEndTag(trimmed)) return true;

    return false;
}

/**
 * 行の先頭スペース数を取得
 * @param {string} line 行文字列
 * @returns {number}
 */
function getLeadingSpaceCount(line) {
    let count = 0;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === ' ') count++;
        else break;
    }
    return count;
}
