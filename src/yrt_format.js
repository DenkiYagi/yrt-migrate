// @ts-check

/**
 * レガシーレイアウトXMLの入力データ
 * @typedef {Object} LegacyLayoutDocument
 * @property {string} xml レイアウトおよびスタイル情報を含むXML文字列
 */

/**
 * マイグレーション後のXMLコレクション
 * @typedef {Object} MigratedXmlCollection
 * @property {string[]} layouts レイアウトXML一覧（1件以上）
 * @property {string|null} style スタイルXML（存在しない場合は null）
 */

/**
 * MigratedXmlCollection を浅くコピーする
 * @param {MigratedXmlCollection} doc 元のコレクション
 * @returns {MigratedXmlCollection} コピーされたコレクション
 */
export function cloneMigratedXmlCollection(doc) {
    return {
        layouts: [...doc.layouts],
        style: doc.style ?? null,
    };
}
