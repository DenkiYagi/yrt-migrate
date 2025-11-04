import { describe, it, expect } from '@jest/globals';
import { DOMParser } from "@xmldom/xmldom";
import { migrate } from '../../src/migrate/warn_grid_like_border_conflict.mjs';
import { withWarningSpy } from '../helpers/warning_spy.js';

const parse = (xml) => new DOMParser().parseFromString(xml, "text/xml");

describe('warn_grid_like_border_conflict', () => {
    it('Grid: 隣接セルがある場合に警告を出す', () => {
        const xml = [
            '<StackBlock>',
            '  <Grid cols="10 10" rows="10">',
            '    <GridCell col="0" row="0" borderRightThickness="3"/>',
            '    <GridCell col="1" row="0" borderLeftThickness="2"/>',
            '  </Grid>',
            '</StackBlock>'
        ].join('\n');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
        expect(warnings[0]).toContain('2行3列目');
    });

    it('Grid: colspan/rowspanで隣接セルがborder系で衝突する場合に警告を出す', () => {
        const xml = [
            '<Grid cols="10 10 10" rows="10 10">',
            '  <GridCell col="0" row="0" colspan="2" borderRightThickness="3"/>',
            '  <GridCell col="2" row="0" borderLeftThickness="2"/>',
            '</Grid>'
        ].join('\n');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it('Grid: 隣接セルでもborderThickness未指定なら警告しない', () => {
        const xml = [
            '<Grid cols="10 10" rows="10">',
            '  <GridCell col="0" row="0" borderRightStyle="dashed"/>',
            '  <GridCell col="1" row="0" borderTopStyle="double"/>',
            '</Grid>'
        ].join('\n');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).toHaveLength(0);
    });

    it('Grid: colspan/rowspanで隣接セルがborder系で衝突しない場合は警告しない', () => {
        const xml = [
            '<Grid cols="10 10 10" rows="10 10">',
            '  <GridCell col="0" row="0" colspan="2" borderRightThickness="3"/>',
            '  <GridCell col="2" row="1" borderLeftThickness="3"/>',
            '</Grid>'
        ].join('\n');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).toHaveLength(0);
    });

    it('Grid: 縦方向の隣接セルで警告を出す', () => {
        const xml = [
            '<Grid cols="10" rows="10 10">',
            '  <GridCell col="0" row="0" borderBottomThickness="1pt"/>',
            '  <GridCell col="0" row="1" borderTopThickness="2pt"/>',
            '</Grid>'
        ].join('\n');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it('Grid: 同じ太さの隣接セルは警告しない', () => {
        const xml = [
            '<Grid cols="10 10" rows="10">',
            '  <GridCell col="0" row="0" borderRightThickness=" THICK "/>',
            '  <GridCell col="1" row="0" borderLeftThickness="thick"/>',
            '</Grid>'
        ].join('\n');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).toHaveLength(0);
    });

    it('Grid: "_" 指定がある場合は衝突扱いしない', () => {
        const xml = [
            '<Grid cols="10" rows="10 10">',
            '  <GridCell col="0" row="0" borderThickness="1 1 2 1"/>',
            '  <GridCell col="0" row="1" borderTopThickness="_"/>',
            '</Grid>'
        ].join('\n');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).toHaveLength(0);
    });

    it('Table: 隣接セルがある場合に警告を出す', () => {
        const xml = [
            '<Table>',
            '  <TableColumn>',
            '    <TableColumnHeader/>',
            '    <TableColumnTemplate borderRightThickness="2px"/>',
            '    <TableColumnFooter/>',
            '  </TableColumn>',
            '  <TableColumn>',
            '    <TableColumnHeader/>',
            '    <TableColumnTemplate borderLeftThickness="1px"/>',
            '    <TableColumnFooter/>',
            '  </TableColumn>',
            '</Table>'
        ].join('');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it('Table: 隣接セルの厚さが同じ場合は警告しない', () => {
        const xml = [
            '<Table>',
            '  <TableColumn>',
            '    <TableColumnHeader/>',
            '    <TableColumnTemplate borderRightThickness="3"/>',
            '    <TableColumnFooter/>',
            '  </TableColumn>',
            '  <TableColumn>',
            '    <TableColumnHeader/>',
            '    <TableColumnTemplate borderLeftThickness="3"/>',
            '    <TableColumnFooter/>',
            '  </TableColumn>',
            '</Table>'
        ].join('');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).toHaveLength(0);
    });

    it('Table: ヘッダーとテンプレートの隣接セルで警告を出す', () => {
        const xml = [
            '<Table>',
            '  <TableColumn>',
            '    <TableColumnHeader borderBottomThickness="3px"/>',
            '    <TableColumnTemplate borderTopThickness="1px"/>',
            '    <TableColumnFooter/>',
            '  </TableColumn>',
            '</Table>'
        ].join('');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it('Table: テンプレートとフッターの隣接セルで警告を出す', () => {
        const xml = [
            '<Table>',
            '  <TableColumn>',
            '    <TableColumnHeader/>',
            '    <TableColumnTemplate borderBottomThickness="5px"/>',
            '    <TableColumnFooter borderTopThickness="1px"/>',
            '  </TableColumn>',
            '</Table>'
        ].join('');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it('Table: テンプレートの上下罫線が衝突する場合に警告を出す', () => {
        const xml = [
            '<Table>',
            '  <TableColumn>',
            '    <TableColumnHeader/>',
            '    <TableColumnTemplate borderTopThickness="1" borderBottomThickness="2"/>',
            '    <TableColumnFooter/>',
            '  </TableColumn>',
        '</Table>'
        ].join('');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).not.toHaveLength(0);
    });

    it('Table: テンプレート上下の片側のみ指定の場合は警告しない', () => {
        const xml = [
            '<Table>',
            '  <TableColumn>',
            '    <TableColumnHeader/>',
            '    <TableColumnTemplate borderTopThickness="1"/>',
            '    <TableColumnFooter/>',
            '  </TableColumn>',
        '</Table>'
        ].join('');
        const { warnings } = withWarningSpy(diagnostics => migrate(diagnostics, parse(xml), xml));
        expect(warnings).toHaveLength(0);
    });
});
