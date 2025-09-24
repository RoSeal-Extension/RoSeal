# The RoSeal Extension
* Copyright (C) 2022-2025 roseal.live
* Licensed under the [AGPL-3.0](LICENSE) license

<a href="https://www.roseal.live/download/chrome" title="Download on the Chrome Web Store">
  <img src="https://developer.chrome.com/static/docs/webstore/branding/image/iNEddTyWiMfLSwFD6qGq.png" width="340px" height="96px">
</a>
<a href="https://www.roseal.live/download/firefox" title="Download on the Firefox Add-Ons Store">
  <img src="https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg" width="340px" height="96px">
</a>
<br />
<a href="https://www.roseal.live/download/edge" title="Download on the Edge Add-Ons Store">
  Download on the Edge Add-Ons store
</a>

## Building the Extension
### Prerequisites
- Install [Bun](https://bun.sh)
  - If you already have Bun installed, please make sure it is up-to-date with `bun upgrade`
- Install zip if it is not already installed (Linux)
  - run `sudo apt-get install zip`

### Commands
* For Firefox code reviewers, please just use `bun run build --target firefox --release`. If you omit `--release`, it will create a development build, which will not match checksum of the submitted build.

- `bun run build --target <TARGET> [--release]`
  * TARGET = "chrome" | "firefox" | "edge" | "safari"
    * Safari target is currently unused and "experimental".
    * Edge target really is just "chrome" but different env just *incase* we need to do anything related to store policy changes.
  * Omit the brackets in `[--release]` for a release build, omit entirely for a development build.
  * Builds to the `dist/` directory

- `bun run redist`
  * This will build the extension for all targets for redistribution.
  * Builds to the `builds-dist/` directory

## Reminders (Development)
- The port for the dev WS server is `2923`, as in Gaia's birthdate
- The port for the dev API server is `4121`, as in Mizore's birthdate
- The port for the dev WWW server is `359_22`, as in RoSeal's release date