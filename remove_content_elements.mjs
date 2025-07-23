// remove_content_elements.mjs
// <XxxContent>系要素（TextContent, VTextContent, LinkContent, RichTextContent, ColumnTextContent）を削除し中身だけ残す

const TARGET_TAGS = [
  "TextContent",
  "VTextContent",
  "LinkContent",
  "RichTextContent",
  "ColumnTextContent",
];

/**
 * 指定したノード配下のTARGET_TAGS要素をすべて除去し、中身だけ残す
 * @param {Element|Document} node
 */
function removeContentElements(node) {
  if (!node || !node.childNodes) return;
  // 配列コピーしてからループ（childNodesはライブコレクション）
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === 1 && TARGET_TAGS.includes(child.nodeName)) {
      // 子要素を親ノードのchildの直後（弟）に順に挿入
      let ref = child.nextSibling;
      while (child.firstChild) {
        node.insertBefore(child.firstChild, ref);
      }
      node.removeChild(child);
    } else if (child.nodeType === 1) {
      // 再帰的に探索
      removeContentElements(child);
    }
  }
  // 子の展開後、親ノード全体に再帰的に適用（入れ子対応）
  // ただし、再帰の深さを制限したい場合は工夫が必要だが、ここでは単純に再帰
  if (Array.from(node.childNodes).some(
    n => n.nodeType === 1 && TARGET_TAGS.includes(n.nodeName)
  )) {
    removeContentElements(node);
  }
}

/**
 * マイグレーション本体
 * @param {Document} doc
 * @param {any} yrtRoot
 * @returns {any} yrtRoot（変更なし、docのみ書き換え）
 */
export function migrate(doc, yrtRoot) {
  removeContentElements(doc);
  return yrtRoot;
}
