# Overview of this Project

## Background

"yagisan-reports" is a software service that generates PDF reports from user-provided templates.

The previous version of "yagisan-reports" is v1.0.0-alpha.13 and the latest version is v1.0.


## About this Project

This project is a migration tool for template XML data.

The migration tool is a CLI command `yrt-migrate`.
It receives a legacy LayoutXML file (with the root element `<LayoutXml>`) and outputs XML files in the new format.

Supported environment: Node.js v20+


## Commands

- `npm run test:unit` - Run unit tests
- `npm run test:ai:integration` - Run integration tests
- `npm run test:ai:regression` - Run regression tests


## Understanding the XML Format

Legacy XML data consists primarily of a single LayoutXML whose root element is `<LayoutXml>`.

The migrated output for yagisan-reports v1.0 contains:

- Layout XMLs (one or more) in the new schema with the root element `<LinearLayout>` or `<StackLayout>`
- Style XML (zero or one) with the root element `<Style>`


## Known Testing Issues for Codex

When run in the Codex sandbox environment, some tests may fail due to empty stdout/stderr, because the Codex sandbox sometimes does not handle stdout/stderr reliably.
In such cases, do not try to fix them. Just skip the test cases temporarily, but do not remove test codes, and restore them when finishing the task so that they can be verified later in a proper environment.
