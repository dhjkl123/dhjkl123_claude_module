/**
 * 안티그래비티 채팅 응답 콘텐츠를 추출하는 스크립트
 *
 * 사용법: node cdp-read.js [--port 9222] [--output result.txt] [--max-length 0]
 *
 * 최대 스크롤 영역 탐색 → textContent 추출 → CSS 아티팩트 정규식 제거
 */
var fs = require('fs');
var cdp = require('./cdp-client');

function parseArgs() {
  var args = process.argv.slice(2);
  var config = {
    port: 9222,
    output: null,
    maxLength: 0 // 0 = 전체
  };
  for (var i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) { config.port = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--output' && args[i + 1]) { config.output = args[i + 1]; i++; }
    else if (args[i] === '--max-length' && args[i + 1]) { config.maxLength = parseInt(args[i + 1], 10); i++; }
  }
  return config;
}

var READ_EXPRESSION =
  '(function() {' +
  '  var scrollAreas = [];' +
  '  document.querySelectorAll("div").forEach(function(el) {' +
  '    var style = getComputedStyle(el);' +
  '    if ((style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > 500) {' +
  '      scrollAreas.push(el);' +
  '    }' +
  '  });' +
  '  scrollAreas.sort(function(a, b) { return b.textContent.length - a.textContent.length; });' +
  '  var chatArea = scrollAreas[0];' +
  '  if (!chatArea) return JSON.stringify({ error: "no chat area" });' +
  '  var text = chatArea.textContent || "";' +
  '  text = text.replace(/\\/\\* Copied from[\\s\\S]*?\\*\\//g, "");' +
  '  text = text.replace(/@media \\(prefers-color-scheme:[\\s\\S]*?\\}\\s*\\}/g, "");' +
  '  text = text.replace(/\\.[a-zA-Z_][a-zA-Z0-9_-]*\\s*\\{[^}]*\\}/g, "");' +
  '  text = text.replace(/\\.[a-zA-Z_][a-zA-Z0-9_-]*>[:\\s][^{]*\\{[^}]*\\}/g, "");' +
  '  text = text.replace(/div:has\\([^)]*\\)[^{]*\\{[^}]*\\}/g, "");' +
  '  text = text.replace(/table\\s+(th|td)[^{]*\\{[^}]*\\}/g, "");' +
  '  text = text.replace(/Thought for \\d+s/g, "");' +
  '  text = text.replace(/^[\\s\\n]+/, "");' +
  '  var cancelCount = 0;' +
  '  var alwaysRunCount = 0;' +
  '  document.querySelectorAll("button").forEach(function(btn) {' +
  '    var t = (btn.textContent || "").trim();' +
  '    if (t === "Cancel") cancelCount++;' +
  '    if (t === "Always run") alwaysRunCount++;' +
  '  });' +
  '  return JSON.stringify({' +
  '    textLength: text.length,' +
  '    cancelButtons: cancelCount,' +
  '    alwaysRunButtons: alwaysRunCount,' +
  '    content: text' +
  '  });' +
  '})()';

function makeReadExprWithLimit(maxLen) {
  if (maxLen > 0) {
    return READ_EXPRESSION.replace(
      'content: text',
      'content: text.substring(0, ' + maxLen + ')'
    );
  }
  return READ_EXPRESSION;
}

async function main() {
  var config = parseArgs();

  console.log('[시작] 안티그래비티 채팅 응답 읽기...');

  var expr = makeReadExprWithLimit(config.maxLength);
  var result = await cdp.evaluateOnce(expr, { port: config.port, timeout: 15000 });

  if (!result) {
    console.error('[실패] 응답을 읽을 수 없습니다.');
    process.exit(1);
  }

  var parsed = JSON.parse(result);

  if (parsed.error) {
    console.error('[실패]', parsed.error);
    process.exit(1);
  }

  console.log('=== 상태 ===');
  console.log('대화 길이:', parsed.textLength, '자');
  console.log('Cancel 버튼:', parsed.cancelButtons, '개');
  console.log('Always Run 버튼:', parsed.alwaysRunButtons, '개');

  if (config.output) {
    fs.writeFileSync(config.output, parsed.content, 'utf-8');
    console.log('\n[저장됨] ' + config.output + ' (' + parsed.content.length + '자)');
  } else {
    console.log('\n=== 대화 내용 ===');
    console.log(parsed.content);
  }
}

main().catch(function(e) { console.error('[에러]', e.message); process.exit(1); });
