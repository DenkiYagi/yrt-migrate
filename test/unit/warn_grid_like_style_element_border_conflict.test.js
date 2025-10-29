import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { migrate } from '../../src/migrate/warn_grid_like_style_element_border_conflict.mjs';
import { setupWarningSpy } from '../helpers/warning_spy.js';

describe('warn_grid_like_style_element_border_conflict', () => {
    let warningSpy;

    beforeEach(() => {
        warningSpy = setupWarningSpy();
    });

    afterEach(() => {
        warningSpy.restore();
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
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining('Grid')]));
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
        expect(warningSpy.messages()).toHaveLength(0);
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
        const warnings = warningSpy.messages();
        expect(warnings).toEqual(expect.arrayContaining([expect.stringContaining('Table')]));
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
        expect(warningSpy.messages()).toHaveLength(0);
    });
});
