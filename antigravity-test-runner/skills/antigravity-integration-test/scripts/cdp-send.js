/**
 * 안티그래비티 채팅에 프롬프트를 주입하고 전송하는 스크립트
 *
 * 사용법: node cdp-send.js <프롬프트파일.txt> [--port 9222]
 *
 * 핵심 패턴:
 * - Lexical 에디터: editors[editors.length - 1] (마지막 에디터 = 채팅 입력란)
 * - ClipboardEvent paste가 유일하게 작동하는 주입 방식
 * - JSON.stringify로 프롬프트 이스케이프
 */
var fs = require('fs');
var cdp = require('./cdp-client');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function parseArgs() {
  var args = process.argv.slice(2);
  var port = 9222;
  var promptFile = null;
  var promptText = null;

  for (var i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      port = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--text') {
      promptText = args.slice(i + 1).join(' ');
      break;
    } else if (!promptFile) {
      promptFile = args[i];
    }
  }

  if (promptText) return { port: port, prompt: promptText };
  if (!promptFile) {
    console.error('사용법: node cdp-send.js <프롬프트파일.txt> [--port 9222]');
    console.error('       node cdp-send.js --text <프롬프트 텍스트>');
    process.exit(1);
  }
  return { port: port, prompt: fs.readFileSync(promptFile, 'utf-8').trim() };
}

async function main() {
  var config = parseArgs();
  var PROMPT = config.prompt;
  var client = cdp.createClient({ port: config.port });

  console.log('[시작] 프롬프트 주입 (' + PROMPT.length + '자)');
  console.log('[미리보기] ' + PROMPT.substring(0, 80) + (PROMPT.length > 80 ? '...' : ''));

  await client.connect();
  console.log('[연결] 안티그래비티 타겟 연결 성공');

  // 1. 에디터 상태 확인
  console.log('\n[1/5] 에디터 상태 확인...');
  var editorInfo = await client.evaluate(
    '(function(){' +
    'var editors = document.querySelectorAll("[data-lexical-editor]");' +
    'var info = [];' +
    'editors.forEach(function(e,i){' +
    '  var rect = e.getBoundingClientRect();' +
    '  info.push({i:i, w:Math.round(rect.width), h:Math.round(rect.height), visible:rect.width>0, text:e.textContent.substring(0,20)});' +
    '});' +
    'return JSON.stringify(info);' +
    '})()'
  );
  console.log('   에디터:', editorInfo);

  // 2. 하단 채팅 에디터에 포커스 + 클릭
  console.log('[2/5] 하단 채팅 에디터 클릭 & 포커스...');
  var focusResult = await client.evaluate(
    '(function(){' +
    'var editors = document.querySelectorAll("[data-lexical-editor]");' +
    'var e = editors.length > 1 ? editors[editors.length - 1] : editors[0];' +
    'if(!e) return "no editor";' +
    'e.click();' +
    'e.focus();' +
    'return "clicked+focused w=" + Math.round(e.getBoundingClientRect().width) + " y=" + Math.round(e.getBoundingClientRect().y);' +
    '})()'
  );
  console.log('  ', focusResult);
  await sleep(500);

  // 3. ClipboardEvent paste로 텍스트 주입
  console.log('[3/5] ClipboardEvent paste...');
  var escaped = JSON.stringify(PROMPT);
  var pasteResult = await client.evaluate(
    '(function(){' +
    'var editors = document.querySelectorAll("[data-lexical-editor]");' +
    'var e = editors.length > 1 ? editors[editors.length - 1] : editors[0];' +
    'e.focus();' +
    'var d = new DataTransfer();' +
    'd.setData("text/plain", ' + escaped + ');' +
    'var ev = new ClipboardEvent("paste", {bubbles:true, cancelable:true, clipboardData:d});' +
    'var dispatched = e.dispatchEvent(ev);' +
    'return JSON.stringify({dispatched:dispatched, textLen:e.textContent.length, innerLen:e.innerHTML.length});' +
    '})()'
  );
  console.log('  ', pasteResult);
  await sleep(500);

  // 4. 텍스트가 없으면 Input.insertText 폴백
  var pasteStatus = JSON.parse(pasteResult || '{}');
  if (pasteStatus.textLen === 0) {
    console.log('[3b/5] ClipboardEvent 실패, Input.insertText 시도...');
    await client.evaluate(
      '(function(){var editors=document.querySelectorAll("[data-lexical-editor]");' +
      'var e=editors.length>1?editors[editors.length-1]:editors[0];' +
      'e.click();e.focus();})()'
    );
    await sleep(200);
    await client.sendCDP('Input.insertText', { text: PROMPT });
    await sleep(300);
    var fallbackResult = await client.evaluate(
      '(function(){var editors=document.querySelectorAll("[data-lexical-editor]");' +
      'var e=editors.length>1?editors[editors.length-1]:editors[0];' +
      'return JSON.stringify({textLen:e.textContent.length, innerLen:e.innerHTML.length});})()'
    );
    console.log('   폴백 결과:', fallbackResult);
  }
  await sleep(500);

  // 5. 전송 - Send/Submit/전송 버튼 탐색
  console.log('[4/5] 전송 버튼 탐색...');
  var btnInfo = await client.evaluate(
    '(function(){' +
    'var bs = document.querySelectorAll("button");' +
    'var found = [];' +
    'bs.forEach(function(b,i){' +
    '  var t = (b.textContent||"").trim();' +
    '  if(t==="Send"||t==="Submit"||t==="전송") found.push({i:i,text:t,visible:b.getBoundingClientRect().width>0});' +
    '});' +
    'return JSON.stringify(found);' +
    '})()'
  );
  console.log('  ', btnInfo);

  var buttons = JSON.parse(btnInfo || '[]');
  if (buttons.length > 0) {
    console.log('[5/5] Send 버튼 클릭...');
    var clickResult = await client.evaluate(
      '(function(){var bs=document.querySelectorAll("button");' +
      'for(var i=0;i<bs.length;i++){var t=bs[i].textContent.trim();' +
      'if(t==="Send"||t==="Submit"||t==="전송"){bs[i].click();return "clicked:"+t}}return "miss"})()'
    );
    console.log('   결과:', clickResult);
  } else {
    console.log('[5/5] Send 버튼 없음, Enter 키 전송...');
    await client.sendCDP('Input.dispatchKeyEvent', {
      type: 'keyDown', key: 'Enter', code: 'Enter',
      windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13
    });
    await sleep(50);
    await client.sendCDP('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Enter', code: 'Enter',
      windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13
    });
    console.log('   Enter 키 전송 완료');
  }

  console.log('\n전송 완료!');
  client.close();
}

main().catch(function(e) { console.error('[에러]', e.message); process.exit(1); });
