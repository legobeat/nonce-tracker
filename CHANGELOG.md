# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0]
### Uncategorized
- fill in changelog
- chore: add boilerplate CHANGELOG.md
- 1.2.0
- Merge branch 'ci-node-18'
- circleci image deprecation
- ci: run on nodejs v18 by default

## [1.2.0]
### Changed
- Dependency changes
  - Add `eth-block-tracker@^4.4.3` ([#12](https://github.com/MetaMask/nonce-tracker/pull/12))
  - Replace `await-semaphore` with `async-mutex` ([#15](https://github.com/MetaMask/nonce-tracker/pull/15))

- TypeScript definition changes
  - Improve type semantics ([#12](https://github.com/MetaMask/nonce-tracker/pull/12))
  - Change return type of `getGlobalLock` ([#13](https://github.com/MetaMask/nonce-tracker/pull/13))

### Fixed
- Remove unused `assert` dependency ([#14](https://github.com/MetaMask/nonce-tracker/pull/14))
- Add missing `node.engines` field in `package.json` ([#18](https://github.com/MetaMask/nonce-tracker/pull/18))

## [1.1.0]
### Changed
- Convert to TypeScript

### Fixed
- Fix faulty transaction object nonce property typecheck

## [1.0.1]
### Added
- Add documentation

[Unreleased]: https://github.com/legobeat/nonce-tracker/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/legobeat/nonce-tracker/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/legobeat/nonce-tracker/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/legobeat/nonce-tracker/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/legobeat/nonce-tracker/releases/tag/v1.0.1
