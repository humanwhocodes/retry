# Changelog

## [0.4.2](https://github.com/humanwhocodes/retry/compare/retry-v0.4.1...retry-v0.4.2) (2025-02-19)


### Bug Fixes

* handle rejections from temporary promises ([#44](https://github.com/humanwhocodes/retry/issues/44)) ([f59810b](https://github.com/humanwhocodes/retry/commit/f59810b52defa25422430c1d4a48a379173df359))

## [0.4.1](https://github.com/humanwhocodes/retry/compare/retry-v0.4.0...retry-v0.4.1) (2024-11-05)


### Bug Fixes

* Look for specific DEBUG value before outputting debug messages ([#40](https://github.com/humanwhocodes/retry/issues/40)) ([be263df](https://github.com/humanwhocodes/retry/commit/be263df56058a2ff0ee5a6db6fceb1903335ad80))

## [0.4.0](https://github.com/humanwhocodes/retry/compare/retry-v0.3.1...retry-v0.4.0) (2024-10-31)


### Features

* Implement concurrency ([#38](https://github.com/humanwhocodes/retry/issues/38)) ([330552f](https://github.com/humanwhocodes/retry/commit/330552f6545197d902d19b143e94bd09cd6e6852))

## [0.3.1](https://github.com/humanwhocodes/retry/compare/retry-v0.3.0...retry-v0.3.1) (2024-10-04)


### Bug Fixes

* Long retries ([#35](https://github.com/humanwhocodes/retry/issues/35)) ([c551b31](https://github.com/humanwhocodes/retry/commit/c551b31963c1fe29a3a84d8f5be7c6ac93732e64))
* repository url in package.json ([#30](https://github.com/humanwhocodes/retry/issues/30)) ([739480c](https://github.com/humanwhocodes/retry/commit/739480c2a04221464f1245d76b97939c723b8fa9))

## [0.3.0](https://github.com/humanwhocodes/retry/compare/retry-v0.2.4...retry-v0.3.0) (2024-05-09)


### Features

* Allow canceling of retry using AbortSignal ([#25](https://github.com/humanwhocodes/retry/issues/25)) ([e877140](https://github.com/humanwhocodes/retry/commit/e877140bcf28f9d2196a1099b40531ac66e69143))


### Bug Fixes

* Ensure proper types for npm and JSR ([d9eb568](https://github.com/humanwhocodes/retry/commit/d9eb568b71d82934f059cc97f590f077f0b58053))

## [0.2.4](https://github.com/humanwhocodes/retry/compare/retry-v0.2.3...retry-v0.2.4) (2024-05-03)


### Bug Fixes

* Allow retrying with non-Promise thenables ([70f33c0](https://github.com/humanwhocodes/retry/commit/70f33c05fc665a58c6b2d6fbf8300101eecd7558))

## [0.2.3](https://github.com/humanwhocodes/retry/compare/retry-v0.2.2...retry-v0.2.3) (2024-04-12)


### Bug Fixes

* Order of exports in package.json to appease tools ([7f6ab10](https://github.com/humanwhocodes/retry/commit/7f6ab107b933ddb9053b6037045119a5879eadba))

## [0.2.2](https://github.com/humanwhocodes/retry/compare/retry-v0.2.1...retry-v0.2.2) (2024-03-13)


### Bug Fixes

* **ci:** Ensure dist is built for JSR publish ([42b5f6a](https://github.com/humanwhocodes/retry/commit/42b5f6a90f995dcb35e8e2520d25250a6aa356b0))

## [0.2.1](https://github.com/humanwhocodes/retry/compare/retry-v0.2.0...retry-v0.2.1) (2024-03-13)


### Bug Fixes

* **ci:** Add token to enable publishing ([9ba5d3c](https://github.com/humanwhocodes/retry/commit/9ba5d3c75970b84ac22a5628dda37e40c5184707))

## [0.2.0](https://github.com/humanwhocodes/retry/compare/retry-v0.1.3...retry-v0.2.0) (2024-03-13)


### Features

* Add JSR package ([d33c74f](https://github.com/humanwhocodes/retry/commit/d33c74f255aa4040d66344e8ef049ebc3ae41d6a))


### Bug Fixes

* **docs:** make release-please happy ([27fa920](https://github.com/humanwhocodes/retry/commit/27fa920a5ae7d59eae2e6b8ef1c6c323fefd0c86))

## [0.1.3](https://github.com/humanwhocodes/retry/compare/v0.1.2...v0.1.3) (2024-03-01)


### Bug Fixes

* Caught sync errors should throw original message ([657de9c](https://github.com/humanwhocodes/retry/commit/657de9c2c7148dccee5451f74dad901d0e2f0bc8))

## [0.1.2](https://github.com/humanwhocodes/retry/compare/v0.1.1...v0.1.2) (2024-01-17)


### Bug Fixes

* remove duplicate set timeout property ([#7](https://github.com/humanwhocodes/retry/issues/7)) ([3c1e10e](https://github.com/humanwhocodes/retry/commit/3c1e10e1412a6e0f8b32020eb5c4c3a4af7ce8a5))
* repeated error handling ([43f4329](https://github.com/humanwhocodes/retry/commit/43f432944d9ac4cfd272663254dbfbd12faa9009))

## 0.1.1 (2024-01-17)


### Features

* Catch sync functions and throw useful error ([2a39022](https://github.com/humanwhocodes/retry/commit/2a3902271fa15f6b68037227db87d13961731548))
* Initial commit ([6ceda26](https://github.com/humanwhocodes/retry/commit/6ceda26bf39aaba60ae3a07b9711e4b413d67df9))


### Bug Fixes

* package.json data ([27970c0](https://github.com/humanwhocodes/retry/commit/27970c0f709133c5c13c0fa312b579352a3c0434))
