/**
 * 안티그래비티 CDP 연결 상태를 점검하는 프리플라이트 스크립트
 *
 * 사용법: node cdp-status.js [--port 9222] [--json]
 *
 * 출력: CDP 가용성, 안티그래비티 타겟, 에이전트 실행 상태, 에디터 개수
 */
var http = require('http');
var cdp = require('./cdp-client');

function parseArgs() {
  var args = process.argv.slice(2);
  var config = { port: 9222, json: false };
  for (var i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) { config.port = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--json') { config.json = true; }
  }
  return config;
}

var STATUS_EXPRESSION =
  '(function(){' +
  '  var editors = document.querySelectorAll("[data-lexical-editor]");' +
  '  var editorInfo = [];' +
  '  editors.forEach(function(e,i){' +
  '    var rect = e.getBoundingClientRect();' +
  '    editorInfo.push({i:i, w:Math.round(rect.width), h:Math.round(rect.height), visible:rect.width>0});' +
  '  });' +
  '  var cancelCount = 0;' +
  '  var alwaysRunCount = 0;' +
  '  var alwaysAllowCount = 0;' +
  '  var sendVisible = false;' +
  '  document.querySelectorAll("button").forEach(function(btn){' +
  '    var t = (btn.textContent||"").trim();' +
  '    if(t==="Cancel") cancelCount++;' +
  '    if(t==="Always run") alwaysRunCount++;' +
  '    if(t==="Always Allow") alwaysAllowCount++;' +
  '    if(t==="Send"||t==="Submit"||t==="전송") sendVisible=true;' +
  '  });' +
  '  var scrollAreas = [];' +
  '  document.querySelectorAll("div").forEach(function(el){' +
  '    var style = getComputedStyle(el);' +
  '    if((style.overflowY==="auto"||style.overflowY==="scroll")&&el.scrollHeight>500){' +
  '      scrollAreas.push(el);' +
  '    }' +
  '  });' +
  '  scrollAreas.sort(function(a,b){return b.textContent.length-a.textContent.length;});' +
  '  var chatTextLen = scrollAreas[0] ? scrollAreas[0].textContent.length : 0;' +
  '  return JSON.stringify({' +
  '    editorCount: editors.length,' +
  '    editors: editorInfo,' +
  '    agentBusy: cancelCount > 0,' +
  '    needsApproval: alwaysRunCount > 0 || alwaysAllowCount > 0,' +
  '    cancelCount: cancelCount,' +
  '    alwaysRunCount: alwaysRunCount,' +
  '    alwaysAllowCount: alwaysAllowCount,' +
  '    sendButtonVisible: sendVisible,' +
  '    chatTextLength: chatTextLen' +
  '  });' +
  '})()';

async function main() {
  var config = parseArgs();
  var result = {
    cdpAvailable: false,
    antigravityTarget: false,
    targetTitle: null,
    agentBusy: false,
    needsApproval: false,
    editorCount: 0,
    sendButtonVisible: false,
    chatTextLength: 0,
    error: null
  };

  // 1. CDP 가용성 확인
  try {
    var client = cdp.createClient({ port: config.port });
    var targets = await client.getTargets();
    result.cdpAvailable = true;

    // 2. 안티그래비티 타겟 확인
    var m = targets.find(function(t) {
      return t.title && t.title.includes('Antigravity') && t.type === 'page';
    });

    if (m) {
      result.antigravityTarget = true;
      result.targetTitle = m.title;

      // 3. 상세 상태 확인
      var status = await cdp.evaluateOnce(STATUS_EXPRESSION, { port: config.port });
      if (status) {
        var parsed = JSON.parse(status);
        result.editorCount = parsed.editorCount;
        result.agentBusy = parsed.agentBusy;
        result.needsApproval = parsed.needsApproval;
        result.sendButtonVisible = parsed.sendButtonVisible;
        result.chatTextLength = parsed.chatTextLength;
        result.editors = parsed.editors;
        result.cancelCount = parsed.cancelCount;
        result.alwaysRunCount = parsed.alwaysRunCount;
        result.alwaysAllowCount = parsed.alwaysAllowCount;
      }
    }
  } catch (e) {
    result.error = e.message;
  }

  // 출력
  if (config.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('=== 안티그래비티 CDP 상태 점검 ===\n');
    console.log('CDP 연결:       ' + (result.cdpAvailable ? 'OK (포트 ' + config.port + ')' : 'FAIL'));
    console.log('안티그래비티:   ' + (result.antigravityTarget ? 'OK (' + result.targetTitle + ')' : 'NOT FOUND'));

    if (result.antigravityTarget) {
      console.log('에이전트 상태:  ' + (result.agentBusy ? '실행 중 (Cancel=' + result.cancelCount + ')' : '유휴'));
      if (result.needsApproval) {
        console.log('승인 대기:      Yes (AlwaysRun=' + result.alwaysRunCount + ' AlwaysAllow=' + result.alwaysAllowCount + ')');
      }
      console.log('에디터 수:      ' + result.editorCount);
      console.log('Send 버튼:      ' + (result.sendButtonVisible ? '보임' : '안 보임'));
      console.log('채팅 텍스트:    ' + result.chatTextLength + '자');
    }

    if (result.error) {
      console.log('\n[오류] ' + result.error);
    }

    if (!result.cdpAvailable) {
      console.log('\n[안내] Antigravity IDE를 다음 옵션으로 재시작하세요:');
      console.log('  --remote-debugging-port=' + config.port);
    }
  }

  // 종료 코드: 정상=0, CDP 불가=1, 타겟 없음=2
  if (!result.cdpAvailable) process.exit(1);
  if (!result.antigravityTarget) process.exit(2);
}

main().catch(function(e) { console.error('[에러]', e.message); process.exit(1); });
