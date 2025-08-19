# Overview of this Project

## Background

"yagisan-reports" is a software service that generates PDF reports from user-provided templates called YRT (Yagisan Reports Template).

The previous version of "yagisan-reports" is v1.0.0-alpha.13 and the latest version is v1.0.


## About this Project

This project is a migration tool for YRT data, from Legacy YRT format to the new format.

The migration tool is a CLI command `yrt-migrate`.
It receives either a binary data of Legacy YRT, or just a single LayoutXML file in the legacy format (with the root element `<LayoutXml>`).

Supported environment: Node.js v20+


## Commands

- `yarn test` - Run all tests
- `yarn test:unit` - Run unit tests
- `yarn test:integration` - Run integration tests
- `yarn test:generate-fixtures` - Update YRT fixtures for integration tests. Only needed when modified the existing XML fixtures.


## Understanding the YRT format

YRT data consists of XML files and other asset files, and is encoded to a binary format by `msgpack`.

### Legacy YRT

YRT for yagisan-reports v1.0.0-alpha.13 is called "Legacy YRT".
It containts:

- Layout XML (just one), where the root element is always `<LayoutXml>`
- Assets (optional), which is a mapping object from asset names to binary data

### New YRT

YRT for yagisan-reports v1.0 containts:

- doctype (must be "YRT")
- version (must be `1`)
- body

And the body contains:

- LayoutXML (one or multiple), with a new syntax where the root element is not `<LayoutXml>` any more
- StyleXML (zero or one), newly created with the root element `<Style>`
- Assets (optional), unchanged from legacy
