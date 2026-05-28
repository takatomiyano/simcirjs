'use strict';

// simcir-ext.js: URL-based circuit save/load (compatible with nodai2hITC/simcirjs)
var simcirExt = (function() {

  // Symbol substitution table for compact URL encoding.
  // Order matters: longer/more-specific strings must come before shorter ones
  // that could appear as substrings of them.
  var REPLACE = [
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

  function encode(str) {
    var s = str
      .replace(/\.in(\d+)"/g,  '@$1')
      .replace(/\.out(\d+)"/g, '#$1');
    for (var i = 0; i < REPLACE.length; i++) {
      s = rep(s, REPLACE[i][0], REPLACE[i][1]);
    }
    var bytes = new TextEncoder().encode(s);
    var bin = '';
    for (var j = 0; j < bytes.length; j++) { bin += String.fromCharCode(bytes[j]); }
    return btoa(bin).split('+').join('_').split('/').join('-').split('=').join('.');
  }

  function decode(str) {
    var bin = atob(str.split('_').join('+').split('-').join('/').split('.').join('='));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) { bytes[i] = bin.charCodeAt(i); }
    var s = new TextDecoder().decode(bytes);
    for (var j = 0; j < REPLACE.length; j++) {
      s = rep(s, REPLACE[j][1], REPLACE[j][0]);
    }
    return s
      .replace(/@(\d+)/g, '.in$1"')
      .replace(/#(\d+)/g, '.out$1"');
  }

  // Extract encoded circuit data from workspace element
  function getData($workspace) {
    var text = simcir.controller($workspace).text();
    var match = text.match(/"devices"[\s\S]*$/);
    if (!match) { return ''; }
    return encode('{' + match[0].replace(/\s+/g, ''));
  }

  // Restore circuit into placeholder div from encoded hash string
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

  return { encode: encode, decode: decode, getData: getData, setData: setData };

}());
