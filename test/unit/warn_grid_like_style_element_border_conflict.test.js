import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { migrate } from '../../src/migrate/warn_grid_like_style_element_border_conflict.mjs';

describe('warn_grid_like_style_element_border_conflict', () => {
    /** @type {jest.SpiedFunction<typeof console.warn>} */
    let warnSpy;

    beforeEach(() => {
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('GridStyle の borderThickness が異なる場合は警告する', () => {
        const xml = [
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderThickness="1" />',
            '    <GridStyle borderThickness="2" />',
            '  </Grid>',
            '</StackLayout>'
        ].join('\n');
        const doc = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(doc, xml);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Grid'));
    });

    it('GridStyle の太さが同じ場合は警告しない', () => {
        const xml = [
            '<StackLayout>',
            '  <Grid>',
            '    <GridStyle borderThickness="3" />',
            '    <GridStyle borderThickness="3" outerBorderThickness="3 3 3 3" />',
            '  </Grid>',
            '</StackLayout>'
        ].join('\n');
        const doc = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(doc, xml);
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('TableStyle の outerBorderThickness が異なる場合は警告する', () => {
        const xml = [
            '<StackLayout>',
            '  <Table>',
            '    <TableStyle outerBorderThickness="1" />',
            '    <TableStyle outerBorderThickness="2 2" />',
            '  </Table>',
            '</StackLayout>'
        ].join('\n');
        const doc = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(doc, xml);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Table'));
    });

    it('ColumnTextStyle で太さ指定が片方のみの場合は警告しない', () => {
        const xml = [
            '<StackLayout>',
            '  <ColumnText>',
            '    <ColumnTextStyle />',
            '    <ColumnTextStyle borderThickness="4" />',
            '  </ColumnText>',
            '</StackLayout>'
        ].join('\n');
        const doc = { layouts: [{ name: null, xml }], style: null, assets: null };
        migrate(doc, xml);
        expect(warnSpy).not.toHaveBeenCalled();
    });
});
