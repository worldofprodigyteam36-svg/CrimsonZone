self.__uv$config = {
    prefix: '/uv/service/',
    encodeUrl: function(url) { return Ultraviolet.codec.xor.encode(url); },
    decodeUrl: function(url) { return Ultraviolet.codec.xor.decode(url); },
    handler: '/uv/uv.handler.js',
    client: '/uv/uv.client.js',
    bundle: '/uv/uv.bundle.js',
    config: '/uv/uv.config.js',
    sw: '/uv/uv.sw.js',

    ipBlocklist: [
    'api.ipify.org',
    'api.myip.com',
    'checkip.amazonaws.com',
    'icanhazip.com',
    'ifconfig.co',
    'ifconfig.io',
    'ifconfig.me',
    'ident.me',
    'ipecho.net',
    'ip-api.com',
    'ip-api.io',
    'ip.me',
    'ip.sb',
    'ip.tyk.nu',
    'ip4.seeip.org',
    'ip6.seeip.org',
    'ipaddress.is',
    'ipchicken.com',
    'ipconfig.io',
    'ipinfo.io',
    'ipinfo.tw',
    'ipify.org',
    'iplocation.net',
    'iplocation.com',
    'iplogger.org',
    'ipleak.net',
    'iplookup.flagfox.net',
    'ipwho.is',
    'myexternalip.com',
    'myip.com',
    'showip.net',
    'trackip.net',
    'whatismyip.com',
    'whatismyipaddress.com',
    'whatismyip.org',
    'wtfismyip.com',
    'whoer.net',
    'browserleaks.com',
    'dnsleaktest.com',
    'ipleak.com',
    'perfect-privacy.com',
    'doileak.com',
    'geoiplookup.net',
    'ip-tracker.org',
    'ipfingerprints.com',
    'proxycheck.io',
    'scamalytics.com',
    'vpnapi.io',
    'speedtest.net',
    'testmy.net',
    'speed.cloudflare.com',
    'cloudflare.com',
    'ping.pe',
    'network-tools.com',
    'ipvoid.com',
    'hide.me',
    'expressvpn.com',
    'nordvpn.com',
    'surfshark.com',
    'purevpn.com',
    'mullvad.net',
    'proxysite.com',
    'proxyium.com',
    'croxyproxy.com',
    'geotool.xyz',
    'myip.ms',
    'ipqualityscore.com',
    'abuseipdb.com',
    'db-ip.com',
    'ip2location.com',
    'ipstack.com',
    'ipapi.co',
    'bigdatacloud.net',
    'freegeoip.app',
    'geojs.io',
    'ipgeolocation.io',
    'tools.keycdn.com',
    'hostip.info',
    'check-host.net',
    'ipleak.org',
    'ipdetective.io',
    'my-ip.io',
    'findip.net',
    'seeip.org',
    'smart-ip.net',
    'whatismypublicip.com',
    'yourip.me',
    'ip-adress.com',
    'internethealthtest.org',
    'test-ipv6.com',
    'ipv6-test.com',
    'amibehindaproxy.com',
    'highspeedinternet.com',
    'clienttest.ssllabs.com'
],

    inject: [
        {
            host: '.*',
            injectTo: 'head',
            html: `<script>
(() => {
  "use strict";

  const blocked = () => {
    throw new DOMException("WebRTC is disabled by this proxy.", "NotSupportedError");
  };

  const blockPromise = () => Promise.reject(
    new DOMException("WebRTC is disabled by this proxy.", "NotSupportedError")
  );

  for (const name of [
    "RTCPeerConnection",
    "webkitRTCPeerConnection",
    "mozRTCPeerConnection"
  ]) {
    if (name in window) {
      Object.defineProperty(window, name, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function RTCPeerConnection() {
          blocked();
        }
      });
    }
  }

  for (const proto of [
    window.RTCPeerConnection && window.RTCPeerConnection.prototype,
    window.webkitRTCPeerConnection && window.webkitRTCPeerConnection.prototype,
    window.mozRTCPeerConnection && window.mozRTCPeerConnection.prototype
  ]) {
    if (!proto) continue;

    for (const method of [
      "createDataChannel",
      "createOffer",
      "createAnswer",
      "setLocalDescription",
      "setRemoteDescription",
      "addIceCandidate",
      "setConfiguration"
    ]) {
      if (method in proto) {
        Object.defineProperty(proto, method, {
          configurable: false,
          writable: false,
          value: method === "createDataChannel" ? blocked : blockPromise
        });
      }
    }
  }

  if (navigator.mediaDevices) {
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
      configurable: false,
      writable: false,
      value: blockPromise
    });
  }

  if ("RTCDataChannel" in window) {
    Object.defineProperty(window, "RTCDataChannel", {
      configurable: false,
      enumerable: false,
      writable: false,
      value: function RTCDataChannel() {
        blocked();
      }
    });
  }
})();
<\/script>`
        }
    ]
};

if (typeof window !== 'undefined') {
    window.__uv$config = self.__uv$config;
}
