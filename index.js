import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as fs from 'fs/promises';
import * as direction_attribute from './direction_attribute.mjs';
import * as path from 'path';
import * as msgpack from '@msgpack/msgpack';

function migrate(inputLayoutXml) {
    const doc = new DOMParser().parseFromString(inputLayoutXml, 'text/xml');
    
    direction_attribute.migrate(doc);

    const outputLayoutXml = new XMLSerializer().serializeToString(doc);
    return outputLayoutXml;
}

const fileName = process.argv[2];
const ext = path.extname(fileName);

if (ext == ".xml") {
    await fs.copyFile(fileName, `${fileName}.old`);

    const inputLayoutXml = await fs.readFile(fileName, 'utf-8');
    const outputLayoutXml = migrate(inputLayoutXml);

    fs.writeFile(fileName, outputLayoutXml);
    process.exit(0);
} else if (ext == ".yrt") {
    await fs.copyFile(fileName, `${fileName}.old`);

    const inputFile = await fs.readFile(fileName);
    const yrtFile = msgpack.decode(inputFile);

    const inputLayoutXml = yrtFile[0]
    const outputLayoutXml = migrate(inputLayoutXml);

    yrtFile[0] = outputLayoutXml;
    const outputFile = msgpack.encode(yrtFile);

    await fs.writeFile(fileName, Buffer.from(outputFile));
    process.exit(0);
} else {
    console.error("非対応のファイル形式です")
    process.exit(1);
}


