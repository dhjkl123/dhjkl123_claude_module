/**
 * 안티그래비티 테스트 완료 여부를 폴링하고, 완료시 결과를 저장하는 스크립트
 *
 * 사용법: node cdp-poll.js [--port 9222] [--output result.txt] [--interval 15] [--max-polls 120] [--beep] [--auto-approve] [--exit-on-approve]
 *
 * 완료 조건: Cancel 버튼 0개 + 텍스트 1000자 이상 + 2회 연속 동일 길이
 * --beep 플래그: 승인 필요(Always run/Allow) 감지 시 비프음 발생 (기본: 꺼짐)
 * --auto-approve 플래그: "Always run" / "Always Allow" 버튼 자동 클릭 (기본: 꺼짐)
 * --exit-on-approve 플래그: 승인 필요 감지 시 종료코드 3으로 종료 (사용자 확인 후 cdp-approve.js로 승인)
 */
var fs = require('fs');
var cdp = require('./cdp-client');
var exec = require('child_process').exec;

function parseArgs() {
  var args = process.argv.slice(2);
  var config = {
    port: 9222,
    output: 'antigravity-test-result.txt',
    interval: 15000,
    maxPolls: 120,
    beep: false,
    autoApprove: false,
    exitOnApprove: false
  };
  for (var i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) { config.port = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--output' && args[i + 1]) { config.output = args[i + 1]; i++; }
    else if (args[i] === '--interval' && args[i + 1]) { config.interval = parseInt(args[i + 1], 10) * 1000; i++; }
    else if (args[i] === '--max-polls' && args[i + 1]) { config.maxPolls = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--beep') { config.beep = true; }
    else if (args[i] === '--auto-approve') { config.autoApprove = true; }
    else if (args[i] === '--exit-on-approve') { config.exitOnApprove = true; }
  }
  return config;
}

function beep() {
  if (process.platform === 'win32') {
    exec('powershell -c "[console]::beep(1000,500);[console]::beep(1200,500);[console]::beep(1000,500)"');
  } else {
    process.stdout.write('\x07');
  }
}

var POLL_EXPRESSION =
  '(function() {' +
  '  var cancelCount = 0;' +
  '  var alwaysRunCount = 0;' +
  '  var alwaysAllowCount = 0;' +
  '  document.querySelectorAll("button").forEach(function(btn) {' +
  '    var text = (btn.textContent || "").trim();' +
  '    if (text === "Cancel") cancelCount++;' +
  '    if (text === "Always run") alwaysRunCount++;' +
  '    if (text === "Always Allow") alwaysAllowCount++;' +
  '  });' +
  '  var scrollAreas = [];' +
  '  document.querySelectorAll("div").forEach(function(el) {' +
  '    var style = getComputedStyle(el);' +
  '    if ((style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > 500) {' +
  '      scrollAreas.push(el);' +
  '    }' +
  '  });' +
  '  scrollAreas.sort(function(a, b) { return b.textContent.length - a.textContent.length; });' +
  '  var chatArea = scrollAreas[0];' +
  '  var textLen = chatArea ? chatArea.textContent.length : 0;' +
  '  return JSON.stringify({' +
  '    cancelCount: cancelCount,' +
  '    alwaysRunCount: alwaysRunCount,' +
  '    alwaysAllowCount: alwaysAllowCount,' +
  '    textLen: textLen' +
  '  });' +
  '})()';

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
  '  if (!chatArea) return "";' +
  '  var text = chatArea.textContent || "";' +
  '  text = text.replace(/\\/\\* Copied from[\\s\\S]*?\\*\\//g, "");' +
  '  text = text.replace(/@media \\(prefers-color-scheme:[\\s\\S]*?\\}\\s*\\}/g, "");' +
  '  text = text.replace(/\\.[a-zA-Z_][a-zA-Z0-9_-]*\\s*\\{[^}]*\\}/g, "");' +
  '  text = text.replace(/\\.[a-zA-Z_][a-zA-Z0-9_-]*>[:\\s][^{]*\\{[^}]*\\}/g, "");' +
  '  text = text.replace(/div:has\\([^)]*\\)[^{]*\\{[^}]*\\}/g, "");' +
  '  text = text.replace(/table\\s+(th|td)[^{]*\\{[^}]*\\}/g, "");' +
  '  text = text.replace(/Thought for \\d+s/g, "");' +
  '  text = text.replace(/^[\\s\\n]+/, "");' +
  '  return text;' +
  '})()';

async function main() {
  var config = parseArgs();
  var prevTextLen = 0;
  var stableCount = 0;
  var prevNeedsInput = false;

  console.log('[시작] 안티그래비티 테스트 완료 대기 중...');
  console.log('[설정] 폴링 간격: ' + (config.interval / 1000) + '초, 최대 대기: ' + Math.round(config.maxPolls * config.interval / 60000) + '분');
  console.log('[출력] ' + config.output + '\n');

  for (var i = 0; i < config.maxPolls; i++) {
    try {
      var result = await cdp.evaluateOnce(POLL_EXPRESSION, { port: config.port });
      if (!result) {
        console.log('[' + new Date().toLocaleTimeString() + '] 폴링 실패');
        await new Promise(function(r) { setTimeout(r, config.interval); });
        continue;
      }

      var status = JSON.parse(result);
      var needsInput = status.alwaysRunCount > 0 || status.alwaysAllowCount > 0;
      var isRunning = status.cancelCount > 0;
      var textGrew = status.textLen > prevTextLen;

      console.log('[' + new Date().toLocaleTimeString() + '] ' +
        'Cancel=' + status.cancelCount +
        ' AlwaysRun=' + status.alwaysRunCount +
        ' AlwaysAllow=' + status.alwaysAllowCount +
        ' text=' + status.textLen + '자' +
        (textGrew ? ' (+' + (status.textLen - prevTextLen) + ')' : '') +
        (needsInput ? ' !! 승인필요' : '') +
        (isRunning ? ' [실행중]' : ' [대기]'));

      // 승인 필요 상태가 새로 발생했을 때 처리
      if (needsInput && !prevNeedsInput) {
        if (config.exitOnApprove) {
          var approvalTypes = [];
          if (status.alwaysRunCount > 0) approvalTypes.push('Always run (' + status.alwaysRunCount + '개)');
          if (status.alwaysAllowCount > 0) approvalTypes.push('Always Allow (' + status.alwaysAllowCount + '개)');
          console.log('\n[승인필요] ' + approvalTypes.join(', '));
          console.log('[대기] 승인 후 폴링을 재시작하세요.');
          if (config.beep) beep();
          process.exit(3);
        } else if (config.autoApprove) {
          console.log('  >> 자동 승인 시도 중...');
          try {
            var approveResult = await cdp.evaluateOnce(
              '(function(){' +
              '  var clicked = [];' +
              '  document.querySelectorAll("button").forEach(function(btn){' +
              '    var t = (btn.textContent||"").trim();' +
              '    if(t==="Always run"||t==="Always Allow"){' +
              '      btn.click(); clicked.push(t);' +
              '    }' +
              '  });' +
              '  return clicked.length > 0 ? "approved:" + clicked.join(",") : "no_buttons";' +
              '})()',
              { port: config.port, timeout: 5000 }
            );
            console.log('  >> 자동 승인 결과: ' + approveResult);
          } catch (ae) {
            console.log('  >> 자동 승인 실패: ' + ae.message);
          }
        } else if (config.beep) {
          beep();
          console.log('  >> 승인 필요 알림 (비프)');
        } else {
          console.log('  >> 승인 필요 (--auto-approve 또는 --beep 으로 활성화)');
        }
      }
      prevNeedsInput = needsInput;

      // 완료 판단: 실행중 아니고 + 1000자 이상 + 2회 연속 안정
      if (!isRunning && !needsInput && status.textLen > 1000) {
        if (status.textLen === prevTextLen) {
          stableCount++;
        } else {
          stableCount = 0;
        }

        if (stableCount >= 2) {
          console.log('\n[완료] 테스트가 완료된 것으로 판단됩니다!');
          if (config.beep) beep();

          // 전체 내용 읽기 및 저장
          var content = await cdp.evaluateOnce(READ_EXPRESSION, { port: config.port, timeout: 15000 });
          if (content) {
            fs.writeFileSync(config.output, content, 'utf-8');
            console.log('[저장됨] ' + config.output + ' (' + content.length + '자)');
          }
          process.exit(0);
        }
      } else {
        stableCount = 0;
      }

      prevTextLen = status.textLen;
    } catch (e) {
      console.log('[에러] ' + e.message);
    }

    await new Promise(function(r) { setTimeout(r, config.interval); });
  }

  console.log('[타임아웃] 최대 대기 시간 초과');
  process.exit(1);
}

main().catch(function(e) { console.error('[에러]', e.message); process.exit(1); });
