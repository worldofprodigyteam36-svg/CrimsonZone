# Changes

This project is a modified fork of [POWBoy1/CrimsonZone](https://github.com/POWBoy1/CrimsonZone),
which was released under the MIT License. It was modified in September 2026
and has been updated since. This file is the modification notice for the GNU
Affero General Public License v3, section 5(a).

The complete, dated record of every modification is the commit history:
https://github.com/worldofprodigyteam36-svg/CrimsonZone/commits/main

Notable changes include:

- Relicensed from MIT to AGPL-3.0-only (see `LICENSE`, `LICENSE-AGPL-3.0`,
  `LICENSE-MIT` and `THIRD_PARTY_NOTICES.md`).
- Added a footer link to the source code repository (AGPL section 13).
- `public/uv/uv.sw.js` is the upstream Ultraviolet v3.2.10 service worker
  with one `importScripts(...)` line added at the top.
- `public/epoxy-compat/index.mjs` is a small subclass of the AGPL Epoxy
  transport.
- Added `public/check.html`, a proxy self-test page.

Other changes may have been made by the project's contributors. See the
commit history above for details.
