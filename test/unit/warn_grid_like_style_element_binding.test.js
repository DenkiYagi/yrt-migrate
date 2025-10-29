import { jest } from '@jest/globals';
import { migrate } from '../../src/migrate/warn_grid_like_style_element_binding.mjs';

describe('warn_grid_like_style_element_binding', () => {
    let warnSpy;

    beforeEach(() => {
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('warns when GridStyle attribute contains binding', () => {
        const xml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderColor="${color}" />',
            '  </Grid>',
            '</StackLayout>'
        ].join('\n');
        const doc = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(doc, xml);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('GridStyle'));
    });

    it('warns when TableStyle attribute contains binding', () => {
        const xml = [
            '<StackLayout>',
            '  <Table>',
            '    <TableStyle foreach="${items}" />',
            '  </Table>',
            '</StackLayout>'
        ].join('\n');
        const doc = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(doc, xml);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('TableStyle'));
    });

    it('warns when ColumnTextStyle attribute contains binding', () => {
        const xml = [
            '<StackLayout>',
            '  <ColumnText>',
            '    <ColumnTextStyle borderColor="${foo}" />',
            '  </ColumnText>',
            '</StackLayout>'
        ].join('\n');
        const doc = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(doc, xml);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('ColumnTextStyle'));
    });

    it('warns for StyleXML as well', () => {
        const xml = '<StackLayout></StackLayout>';
        const style = [
            '<Style>',
            '  <GridStyle borderColor="${color}" />',
            '</Style>'
        ].join('\n');
        const doc = { layouts: [{ name: null, xml }], style, assets: null };
        migrate(doc, style);
        expect(warnSpy).toHaveBeenCalled();
    });

    it('does not warn when no bindings present', () => {
        const xml = [
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderColor="red" />',
            '  </Grid>',
            '</StackLayout>'
        ].join('\n');
        const doc = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(doc, xml);
        expect(warnSpy).not.toHaveBeenCalled();
    });
});
