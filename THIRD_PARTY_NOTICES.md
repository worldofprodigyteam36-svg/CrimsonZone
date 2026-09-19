# Third-Party Notices

CrimsonZone incorporates or depends on the following third-party software.
Each remains under its own license. Full license texts ship with each package
(in `node_modules/<package>/LICENSE`) and at the URLs below.

## Runtime dependencies that ship to or run for users

| Package | License | Notes |
|---|---|---|
| @mercuryworkshop/epoxy-transport | AGPL-3.0-only | Served to browsers at `/epoxy/`; extended by `public/epoxy-compat/index.mjs` |
| @mercuryworkshop/wisp-js | AGPL-3.0 | Used server-side (`server/index.js`) for the Wisp endpoint |
| @titaniumnetwork-dev/ultraviolet | **Conflicting: `package.json` says MIT, shipped `LICENSE` file is AGPL-3.0** | Bundled in `public/uv/`. See the Ultraviolet section below |
| @mercuryworkshop/bare-mux | MIT (Copyright 2024 Mercury Workshop Inc.) | Served at `/baremux/`. Its `LICENSE` file is MIT text, although `package.json` has no `license` field |
| express, cors, helmet, morgan, ws, fastify, @fastify/static | MIT | Server framework and utilities |

## Ultraviolet (bundled in public/uv/)

Version 3.2.10 of `@titaniumnetwork-dev/ultraviolet` is internally inconsistent:
its `package.json` declares `"license": "MIT"`, but the `LICENSE` file shipped in
the same package is the full GNU AGPL v3 text.

Because CrimsonZone is distributed under AGPL-3.0-only, the combined work is
compatible with either reading. To remove the ambiguity, check the upstream
repository (https://github.com/titaniumnetwork-dev/Ultraviolet) for its current
license and copyright holder, and paste the exact upstream copyright line here
before publishing. Do not assume MIT.

## Original CrimsonZone code

Original work by POWBoy1 was released under the MIT License:

    MIT License
    Copyright (c) 2026 POWBoy1
    (full text in LICENSE-MIT)

Modifications and the combined work are distributed under AGPL-3.0-only
(see LICENSE-AGPL-3.0).

## Artwork and trademarks

Icons and thumbnails named after third-party products or games are the
property of their respective owners and are **not** covered by the software
license above. Remove them or replace them with assets you have the right to
distribute.
