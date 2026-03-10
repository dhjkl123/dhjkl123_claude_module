/**
 * 안티그래비티 승인 버튼("Always run" / "Always Allow")을 클릭하는 스크립트
 *
 * 사용법: node cdp-approve.js [--port 9222]
 *
 * cdp-poll.js가 --exit-on-approve로 승인 대기 상태를 감지한 후,
 * 사용자 확인을 거쳐 이 스크립트로 승인 버튼을 대리 클릭합니다.
 */
var cdp = require('./cdp-client');

function parseArgs() {
  var args = process.argv.slice(2);
  var config = { port: 9222 };
  for (var i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) { config.port = parseInt(args[i + 1], 10); i++; }
  }
  return config;
}

var APPROVE_EXPRESSION =
  '(function(){' +
  '  var clicked = [];' +
  '  document.querySelectorAll("button").forEach(function(btn){' +
  '    var t = (btn.textContent||"").trim();' +
  '    if(t==="Always run"||t==="Always Allow"){' +
  '      btn.click(); clicked.push(t);' +
  '    }' +
  '  });' +
  '  return JSON.stringify({ clicked: clicked, count: clicked.length });' +
  '})()';

async function main() {
  var config = parseArgs();

  console.log('[승인] 승인 버튼 클릭 시도...');

  var result = await cdp.evaluateOnce(APPROVE_EXPRESSION, { port: config.port, timeout: 5000 });

  if (!result) {
    console.error('[실패] CDP 연결 실패');
    process.exit(1);
  }

  var parsed = JSON.parse(result);

  if (parsed.count > 0) {
    console.log('[완료] ' + parsed.count + '개 버튼 클릭: ' + parsed.clicked.join(', '));
  } else {
    console.log('[없음] 승인 버튼이 없습니다.');
  }
}

main().catch(function(e) { console.error('[에러]', e.message); process.exit(1); });
