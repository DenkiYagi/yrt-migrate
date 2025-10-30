// @ts-check

import { warnWithLocation } from "../warn_with_location.mjs";

/**
 * <Image>要素のwidth属性必須化警告
 * @param {import("../diagnostics.mjs").DiagnosticsBuffer} diagnostics
 * @param {Document} originalDocument - 変換前のXMLをパースしたドキュメント（検査用）
 * @param {string} originalXml - 変換前のXML文字列（警告メッセージ用）
 * @returns {void}
 */
export function migrate(diagnostics, originalDocument, originalXml) {
    if (!originalDocument) return;
    const images = originalDocument.getElementsByTagName("Image");
    for (let j = 0; j < images.length; j++) {
        const image = images[j];
        if (!image.hasAttribute("width")) {
            warnWithLocation(diagnostics, originalXml, image, [
                "Image要素にwidth属性が導入されました。",
                "必須属性であり、自動処理では値を設定できません。",
                "レイアウトXMLを手動で修正し、width属性を追加してください。"
            ]);
        }
    }
}
