/*
 * CrimsonZone - Epoxy compatibility transport
 * Copyright (c) 2026 CrimsonZone contributors
 *
 * This file extends @mercuryworkshop/epoxy-transport, which is licensed
 * under the GNU Affero General Public License v3.0 (AGPL-3.0-only).
 * This file is therefore distributed under AGPL-3.0-only as well.
 *
 * Source code: https://github.com/worldofprodigyteam36-svg/CrimsonZone
 * License text: /LICENSE-AGPL-3.0 in the repository
 */
import EpoxyTransport from '/epoxy/index.mjs';

export default class EpoxyCompatTransport extends EpoxyTransport {
  async request(remote, method, body, headers, signal) {
    const normalizedHeaders = headers && typeof headers[Symbol.iterator] === 'function'
      ? headers
      : Object.entries(headers || {});

    const response = await super.request(remote, method, body, normalizedHeaders, signal);
    if (Array.isArray(response.headers)) {
      response.headers = response.headers.reduce((acc, [key, value]) => {
        if (acc[key]) {
          acc[key] = Array.isArray(acc[key]) ? [...acc[key], value] : [acc[key], value];
        } else {
          acc[key] = value;
        }
        return acc;
      }, {});
    }

    return response;
  }
}
