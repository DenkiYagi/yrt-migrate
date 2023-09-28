import { DOMParser, XMLSerializer } from '@xmldom/xmldom'
import { readFileSync } from 'fs'
import * as direction_attribute from './direction_attribute.mjs'

const inputFile = readFileSync(process.argv[2], 'utf-8')

const doc = new DOMParser().parseFromString(inputFile, 'text/xml')

direction_attribute.migrate(doc)

console.log(new XMLSerializer().serializeToString(doc))
