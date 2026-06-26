'use strict';

// simcir-ext.js: URL-based circuit save/load (compatible with nodai2hITC/simcirjs)
var simcirExt = (function() {

  // Legacy symbol substitution table — kept only for decoding old-format URLs.
  // Order matters: longer/more-specific strings must come before shorter ones.
  var LEGACY_REPLACE = [
    ['"devices":[',    '@D'],
    ['],"connectors":[', '@C'],
    ['{"type":',       '%P'],
    [',"color":',      '%C'],
    [',"id":',         '%I'],
    [',"x":',          '%X'],
    [',"y":',          '%Y'],
    [',"label":',      '%L'],
    [',"state":',      '%S'],
    ['"on":',          '%O'],
    ['{"from":',       '%F'],
    [',"to":',         '%2'],
    ['"dev',           '%D'],
    ['true',           '#T'],
    ['false',          '#F'],
    ['"#ff0000"',      '#R'],
    ['"#00ff00"',      '#G'],
    ['"#0000ff"',      '#B'],
    ['"DC"',           '$D'],
    ['"Toggle"',       '$T'],
    ['"LED"',          '$L'],
    ['"AND"',          '$A'],
    ['"OR"',           '$O'],
    ['"NOT"',          '$N'],
    ['"NAND"',         '$M'],
    ['"NOR"',          '$r'],
    ['"XOR"',          '$X'],
    ['"XNOR"',         '$n'],
    ['"BUF"',          '$U'],
    ['"7seg"',         '$7'],
    ['"4bit7seg"',     '$4'],
    ['"OSC"',          '$o'],
    ['"PushOn"',       '$p'],
    ['"PushOff"',      '$P'],
    ['"In"',           '$i'],
    ['"Out"',          '$u'],
    ['"Joint"',        '$j']
  ];

  function rep(str, from, to) {
    return str.split(from).join(to);
  }

  // Decode hash strings produced by the old custom symbol-substitution + base64 scheme.
  // Old format uses URL-safe base64 chars (A-Za-z0-9 _ - .) so it always contains
  // '_' or '.' for any non-trivial payload — these chars never appear in LZString output.
  function legacyDecode(str) {
    var bin = atob(str.split('_').join('+').split('-').join('/').split('.').join('='));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
    var s = new TextDecoder().decode(bytes);
    for (var j = 0; j < LEGACY_REPLACE.length; j++) {
      s = rep(s, LEGACY_REPLACE[j][1], LEGACY_REPLACE[j][0]);
    }
    return s
      .replace(/@(\d+)/g, '.in$1"')
      .replace(/#(\d+)/g, '.out$1"');
  }

  // ---------------------------------------------------------------------------
  // Standard LZString encode/decode (used by "URLとしてコピー")
  // ---------------------------------------------------------------------------

  function encode(str) {
    return LZString.compressToEncodedURIComponent(str);
  }

  // Detect format by characters exclusive to each scheme:
  //   'q:' prefix  → QR compact format
  //   '_' or '.'   → old URL-safe base64 format
  //   otherwise    → LZString format
  function decode(str) {
    if (str.slice(0, 2) === 'q:') {
      return decodeQR(str);
    }
    if (str.indexOf('_') !== -1 || str.indexOf('.') !== -1) {
      return legacyDecode(str);
    }
    return LZString.decompressFromEncodedURIComponent(str);
  }

  // ---------------------------------------------------------------------------
  // QR-specific compact encode/decode (used by "QRコードを表示" only)
  //
  // Format identifier: 'q:' prefix (the colon never appears in LZString or
  // legacy base64 output, so detection is unambiguous).
  //
  // Compact JSON schema:
  //   { v:1,
  //     d: [ {t, x, y, [c], [l], [s]} … ],   // devices
  //     c: [ ["Ni M", "No M"] … ]              // connectors as short port strings
  //   }
  // Optimisations vs standard JSON:
  //   - Short field names (t/x/y/c/l/s instead of type/x/y/color/label/state)
  //   - label omitted when equal to type (redundant for OR, DC, etc.)
  //   - state omitted when false (default); stored as s:1 when true
  //   - connector endpoints encoded as "NiM"/"NoM" instead of "devN.inM"/"devN.outM"
  // ---------------------------------------------------------------------------

  function _portStr(s) {
    return s.replace(/^dev(\d+)\.(in|out)(\d+)$/, function(_, di, pt, pi) {
      return di + (pt === 'in' ? 'i' : 'o') + pi;
    });
  }

  function _expandPort(s) {
    return s.replace(/^(\d+)([io])(\d+)$/, function(_, di, pt, pi) {
      return 'dev' + di + '.' + (pt === 'i' ? 'in' : 'out') + pi;
    });
  }

  function encodeQR(data) {
    var compact = {
      v: 1,
      d: data.devices.map(function(d) {
        var cd = {t: d.type, x: d.x, y: d.y};
        if (d.color) { cd.c = d.color; }
        if (d.label !== undefined && d.label !== d.type) { cd.l = d.label; }
        if (d.state && d.state.on === true) { cd.s = 1; }
        return cd;
      }),
      c: data.connectors.map(function(conn) {
        return [_portStr(conn.from), _portStr(conn.to)];
      })
    };
    return 'q:' + LZString.compressToEncodedURIComponent(JSON.stringify(compact));
  }

  function decodeQR(hash) {
    var compact;
    try {
      compact = JSON.parse(LZString.decompressFromEncodedURIComponent(hash.slice(2)));
    } catch(e) { return null; }
    return JSON.stringify({
      devices: compact.d.map(function(cd, i) {
        var d = {
          type:  cd.t,
          id:    'dev' + i,
          x:     cd.x,
          y:     cd.y,
          label: cd.l !== undefined ? cd.l : cd.t
        };
        if (cd.c) { d.color = cd.c; }
        if (cd.s) { d.state = {on: true}; }
        return d;
      }),
      connectors: compact.c.map(function(c) {
        return {from: _expandPort(c[0]), to: _expandPort(c[1])};
      })
    });
  }

  // ---------------------------------------------------------------------------
  // Workspace accessors
  // ---------------------------------------------------------------------------

  // Extract standard LZString-encoded circuit hash from workspace.
  function getData($workspace) {
    var text = simcir.controller($workspace).text();
    var match = text.match(/"devices"[\s\S]*$/);
    if (!match) { return ''; }
    return encode('{' + match[0].replace(/\s+/g, ''));
  }

  // Extract QR-optimised compact hash from workspace (for QR code only).
  function getQRData($workspace) {
    var text = simcir.controller($workspace).text();
    var match = text.match(/"devices"[\s\S]*$/);
    if (!match) { return ''; }
    var data;
    try {
      data = JSON.parse('{' + match[0].replace(/\s+/g, ''));
    } catch(e) { return ''; }
    return encodeQR(data);
  }

  // Restore circuit into placeholder div from any supported hash string.
  function setData($placeholder, toolboxConfig, hash) {
    var json;
    try { json = JSON.parse(decode(hash)); }
    catch (e) { return false; }
    var data = JSON.parse(JSON.stringify(toolboxConfig));
    if (json.devices)    { data.devices    = json.devices; }
    if (json.connectors) { data.connectors = json.connectors; }
    simcir.setupSimcir($placeholder, data);
    return true;
  }

  return {
    encode:    encode,
    decode:    decode,
    getData:   getData,
    getQRData: getQRData,
    setData:   setData
  };

}());
