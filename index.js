import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as fs from 'fs/promises';
import * as direction_attribute from './direction_attribute.mjs';

const fileName = process.argv[2];
await fs.copyFile(fileName, `${fileName}.old`);

const inputFile = await fs.readFile(fileName, 'utf-8');

const doc = new DOMParser().parseFromString(inputFile, 'text/xml');

direction_attribute.migrate(doc);

const output = new XMLSerializer().serializeToString(doc);
fs.writeFile(fileName, output);
