import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { jest } from "@jest/globals";
import { validateXmlInput } from "../../../src/migration_alpha13/input_file_validator.mjs";

describe("validateXmlInput", () => {
    /** @type {string} */
    let tempDir;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), "yrt-migrate-input-validator-"));
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
        jest.restoreAllMocks();
    });

    it("正常なXMLファイルをLegacyLayoutDocumentとして返す", async () => {
        const inputFile = join(tempDir, "valid.xml");
        const xml = "<LayoutXml><LinearLayout/></LayoutXml>";
        await writeFile(inputFile, xml, "utf8");

        await expect(validateXmlInput(inputFile)).resolves.toEqual({ xml });
    });

    it("warning結果のときはconsole.warnを出しつつ値を返す", async () => {
        const inputFile = join(tempDir, "warning.xml");
        const xml = '<LayoutXml id=unquoted><LinearLayout/></LayoutXml>';
        await writeFile(inputFile, xml, "utf8");
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

        await expect(validateXmlInput(inputFile)).resolves.toEqual({ xml });
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.mock.calls[0][0]).toContain("[WARNING]");
    });

    it("error結果のときは説明付きErrorでrejectする", async () => {
        const inputFile = join(tempDir, "invalid.xml");
        await writeFile(inputFile, "<OtherRoot/>", "utf8");

        await expect(validateXmlInput(inputFile)).rejects.toThrow("XMLファイル形式が不正です");
    });
});
