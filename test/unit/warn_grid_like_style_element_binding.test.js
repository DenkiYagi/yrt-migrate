import { DOMParser } from "@xmldom/xmldom";
import { migrate } from '../../src/migrate/warn_grid_like_style_element_binding.mjs';
import { setupWarningSpy } from '../helpers/warning_spy.js';

describe('warn_grid_like_style_element_binding', () => {
    let warningSpy;

    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });

    afterEach(() => {
        warningSpy.restore();
    });

    it('GridStyle の属性にバインドがある場合は警告する', () => {
        const xml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderColor="${color}" />',
            '  </Grid>',
            '</StackLayout>'
        ].join('\n');
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc, xml);
        expect(warningSpy.messages()).toEqual(expect.arrayContaining([expect.stringContaining('GridStyle')]));
    });

    it('TableStyle の属性にバインドがある場合は警告する', () => {
        const xml = [
            '<StackLayout>',
            '  <Table>',
            '    <TableStyle foreach="${items}" />',
            '  </Table>',
            '</StackLayout>'
        ].join('\n');
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc, xml);
        expect(warningSpy.messages()).toEqual(expect.arrayContaining([expect.stringContaining('TableStyle')]));
    });

    it('ColumnTextStyle の属性にバインドがある場合は警告する', () => {
        const xml = [
            '<StackLayout>',
            '  <ColumnText>',
            '    <ColumnTextStyle borderColor="${foo}" />',
            '  </ColumnText>',
            '</StackLayout>'
        ].join('\n');
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc, xml);
        expect(warningSpy.messages()).toEqual(expect.arrayContaining([expect.stringContaining('ColumnTextStyle')]));
    });

    it('Style XML も同様に警告する', () => {
        const xml = '<LayoutXml><Style><GridStyle borderColor="${color}" /></Style></LayoutXml>';
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc, xml);
        expect(warningSpy.messages()).not.toHaveLength(0);
    });

    it('バインドが無い場合は警告しない', () => {
        const xml = [
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderColor="red" />',
            '  </Grid>',
            '</StackLayout>'
        ].join('\n');
        const doc = new DOMParser().parseFromString(xml, "text/xml");
        migrate(doc, xml);
        expect(warningSpy.messages()).toHaveLength(0);
    });
});
