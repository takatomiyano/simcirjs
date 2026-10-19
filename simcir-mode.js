'use strict';

// simcir-mode.js: 学習モード／発展モード共通のページ処理
// （URLコピー・QRコード表示・URLハッシュからの回路復元）
//
// 各ページでは、このファイルを読み込む前に TOOLBOX（ツールボックスに並べる素子の配列）を
// 定義しておく。キャンバスサイズ等は全モード共通。
// URLハッシュには回路（devices/connectors）のみが入り、ツールボックスは含まれないため、
// 同じハッシュをどのモードのページで開いても同じ回路が復元される。

var BASE_CONFIG = {
  width: 640, height: 800,
  showToolbox: true,
  toolbox: TOOLBOX,
  devices: [], connectors: []
};

// ---- Toast ----
var toastTimer = null;
function showToast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show';
  if (toastTimer) { clearTimeout(toastTimer); }
  toastTimer = setTimeout(function() {
    el.className = '';
  }, 2000);
}

// ---- QR code ----
function showQR() {
  var $ = simcir.$;
  // QR専用高圧縮フォーマット(q:プレフィックス)を使用。
  // URLバーは変更せず、QRコード用URLのみ生成する。
  var qrHash = simcirExt.getQRData($('.simcir-workspace'));
  var qrUrl = location.href.split('#')[0] + '#' + qrHash;
  try {
    var qr = qrcode(0, 'M');
    qr.addData(qrUrl);
    qr.make();
    document.getElementById('qrImage').innerHTML = qr.createSvgTag(4, 0);
    document.getElementById('qrUrl').textContent = qrUrl;
    document.getElementById('qrOverlay').className = 'show';
  } catch (e) {
    showToast('URLが長すぎてQRコードを生成できません');
  }
}

function hideQR(e) {
  if (e && e.target !== document.getElementById('qrOverlay')) { return; }
  document.getElementById('qrOverlay').className = '';
}

// ---- URL copy ----
function urlCopy() {
  var $ = simcir.$;
  var hash = simcirExt.getData($('.simcir-workspace'));
  history.replaceState(null, '', location.pathname + '#' + hash);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(location.href)
      .then(function() { showToast('URLをクリップボードにコピーしました'); })
      .catch(function() { legacyCopy(); });
  } else {
    legacyCopy();
  }
}

function legacyCopy() {
  var input = document.createElement('input');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  input.value = location.href;
  document.body.appendChild(input);
  input.select();
  try {
    document.execCommand('copy');
    showToast('URLをクリップボードにコピーしました');
  } catch (e) {
    prompt('このURLをコピーしてください:', location.href);
  }
  document.body.removeChild(input);
}

// ---- Init ----
window.addEventListener('DOMContentLoaded', function() {
  var $ = simcir.$;
  var hash = location.hash.replace('#', '');
  if (hash) {
    if (!simcirExt.setData($('#simcirMain'), BASE_CONFIG, hash)) {
      simcir.setupSimcir($('#simcirMain'), BASE_CONFIG);
      showToast('URLから回路を読み込めませんでした');
    }
  } else {
    simcir.setupSimcir($('#simcirMain'), BASE_CONFIG);
  }
});
