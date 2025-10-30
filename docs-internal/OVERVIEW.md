# Overview of this Project

## Background

"yagisan-reports" is a software service that generates PDF reports from user-provided templates called YRT (Yagisan Reports Template).

The previous version of "yagisan-reports" is v1.0.0-alpha.13 and the latest version is v1.0.


## About this Project

This project is a migration tool for YRT data, from Legacy YRT format to XML files in the new format.

The migration tool is a CLI command `yrt-migrate`.
It receives a legacy LayoutXML file (with the root element `<LayoutXml>`) and outputs XML files in the new format.

Supported environment: Node.js v20+


## Commands

- `npm run test:unit` - Run unit tests
- `npm run test:ai:integration` - Run integration tests
- `npm run test:ai:regression` - Run regression tests

## Understanding the YRT format

Legacy YRT data consists primarily of a single Layout XML whose root element is `<LayoutXml>`.

The migrated output for yagisan-reports v1.0 contains:

- Layout XMLs (one or more) in the new schema
- Style XML (zero or one) with the root element `<Style>`
