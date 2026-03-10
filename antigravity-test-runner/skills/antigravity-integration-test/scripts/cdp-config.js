/**
 * 안티그래비티 채팅 패널의 Conversation Mode와 Model을 설정하는 스크립트
 *
 * 사용법:
 *   node cdp-config.js --mode planning [--port 9222]
 *   node cdp-config.js --model "Gemini 3.1 Pro (High)" [--port 9222]
 *   node cdp-config.js --mode fast --model "Claude Sonnet 4.6 (Thinking)" [--port 9222]
 *   node cdp-config.js --list [--port 9222]
 *
 * 동작 원리:
 *   채팅 입력란 위의 Mode/Model role=button 클릭 → 설정 패널(role=dialog 4개) 오픈
 *   - Dialog[2]: "Conversation mode" 섹션 (Planning / Fast)
 *   - Dialog[3]: "Model" 섹션 (모델 목록)
 *   각 섹션 내 cursor:pointer인 요소를 클릭하여 선택
 */
var cdp = require('./cdp-client');

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function parseArgs() {
  var args = process.argv.slice(2);
  var config = { port: 9222, mode: null, model: null, list: false };
  for (var i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) { config.port = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--mode' && args[i + 1]) { config.mode = args[i + 1]; i++; }
    else if (args[i] === '--model' && args[i + 1]) { config.model = args[i + 1]; i++; }
    else if (args[i] === '--list') { config.list = true; }
  }
  if (!config.mode && !config.model && !config.list) {
    console.error('사용법:');
    console.error('  node cdp-config.js --mode planning|fast [--port 9222]');
    console.error('  node cdp-config.js --model "<모델명>" [--port 9222]');
    console.error('  node cdp-config.js --list [--port 9222]');
    process.exit(1);
  }
  return config;
}

/**
 * 현재 설정된 mode/model 텍스트를 읽어온다.
 */
var READ_CURRENT_EXPR =
  '(function(){' +
  '  var modeBtn = null, modelBtn = null;' +
  '  var modeKeywords = ["planning","fast"];' +
  '  var btns = document.querySelectorAll("[role=button]");' +
  '  btns.forEach(function(el){' +
  '    var t = (el.textContent||"").trim();' +
  '    var tl = t.toLowerCase();' +
  '    var rect = el.getBoundingClientRect();' +
  '    if(rect.width===0) return;' +
  '    for(var i=0;i<modeKeywords.length;i++){' +
  '      if(tl===modeKeywords[i]){ modeBtn={text:t}; return; }' +
  '    }' +
  '    if(t.indexOf("Gemini")>=0||t.indexOf("Claude")>=0||t.indexOf("GPT")>=0){' +
  '      modelBtn={text:t};' +
  '    }' +
  '  });' +
  '  return JSON.stringify({mode:modeBtn, model:modelBtn});' +
  '})()';

/**
 * Mode 또는 Model 버튼을 클릭해서 설정 패널을 연다.
 */
function openSettingsPanel(client) {
  return client.evaluate(
    '(function(){' +
    '  var modeKeywords = ["planning","fast"];' +
    '  var btns = document.querySelectorAll("[role=button]");' +
    '  for(var i=0;i<btns.length;i++){' +
    '    var t = btns[i].textContent.trim().toLowerCase();' +
    '    var rect = btns[i].getBoundingClientRect();' +
    '    if(rect.width===0) continue;' +
    '    for(var j=0;j<modeKeywords.length;j++){' +
    '      if(t===modeKeywords[j]){ btns[i].click(); return "clicked_mode"; }' +
    '    }' +
    '  }' +
    '  for(var i=0;i<btns.length;i++){' +
    '    var t = btns[i].textContent.trim();' +
    '    var rect = btns[i].getBoundingClientRect();' +
    '    if(rect.width===0) continue;' +
    '    if(t.indexOf("Gemini")>=0||t.indexOf("Claude")>=0||t.indexOf("GPT")>=0){' +
    '      btns[i].click(); return "clicked_model";' +
    '    }' +
    '  }' +
    '  return "not_found";' +
    '})()'
  );
}

/**
 * 열린 설정 패널에서 "Conversation mode" 섹션의 옵션 목록을 읽는다.
 */
function readModeOptions(client) {
  return client.evaluate(
    '(function(){' +
    '  var dialogs = document.querySelectorAll("[role=dialog]");' +
    '  for(var i=0;i<dialogs.length;i++){' +
    '    var d = dialogs[i];' +
    '    var rect = d.getBoundingClientRect();' +
    '    if(rect.width===0) continue;' +
    '    var text = d.textContent;' +
    '    if(text.indexOf("Conversation mode")<0) continue;' +
    '    var items = [];' +
    '    d.querySelectorAll("*").forEach(function(el){' +
    '      var t = el.textContent.trim();' +
    '      var r = el.getBoundingClientRect();' +
    '      var cursor = getComputedStyle(el).cursor;' +
    '      if(cursor==="pointer" && r.height>=15 && r.height<=25 && t.length>0 && t.length<30){' +
    '        if(items.indexOf(t)<0) items.push(t);' +
    '      }' +
    '    });' +
    '    return JSON.stringify(items);' +
    '  }' +
    '  return "[]";' +
    '})()'
  );
}

/**
 * 열린 설정 패널에서 "Model" 섹션의 모델 목록을 읽는다.
 */
function readModelOptions(client) {
  return client.evaluate(
    '(function(){' +
    '  var dialogs = document.querySelectorAll("[role=dialog]");' +
    '  for(var i=0;i<dialogs.length;i++){' +
    '    var d = dialogs[i];' +
    '    var rect = d.getBoundingClientRect();' +
    '    if(rect.width===0) continue;' +
    '    var text = d.textContent;' +
    '    if(text.indexOf("Conversation mode")>=0) continue;' +
    '    if(text.indexOf("Gemini")<0 && text.indexOf("Claude")<0 && text.indexOf("GPT")<0) continue;' +
    '    var items = [];' +
    '    d.querySelectorAll("span").forEach(function(el){' +
    '      var t = el.textContent.trim();' +
    '      var r = el.getBoundingClientRect();' +
    '      if(r.width>0 && t.length>5 && t.length<80){' +
    '        if(items.indexOf(t)<0) items.push(t);' +
    '      }' +
    '    });' +
    '    return JSON.stringify(items);' +
    '  }' +
    '  return "[]";' +
    '})()'
  );
}

/**
 * "Conversation mode" 다이얼로그에서 특정 모드를 클릭한다.
 */
function clickMode(client, modeName) {
  var modeTarget = modeName.charAt(0).toUpperCase() + modeName.slice(1).toLowerCase();
  return client.evaluate(
    '(function(){' +
    '  var target = ' + JSON.stringify(modeTarget) + ';' +
    '  var dialogs = document.querySelectorAll("[role=dialog]");' +
    '  for(var i=0;i<dialogs.length;i++){' +
    '    var d = dialogs[i];' +
    '    var rect = d.getBoundingClientRect();' +
    '    if(rect.width===0) continue;' +
    '    if(d.textContent.indexOf("Conversation mode")<0) continue;' +
    '    var els = d.querySelectorAll("*");' +
    '    for(var j=0;j<els.length;j++){' +
    '      var t = els[j].textContent.trim();' +
    '      var cursor = getComputedStyle(els[j]).cursor;' +
    '      if(cursor==="pointer" && t===target){' +
    '        els[j].click(); return "selected:" + t;' +
    '      }' +
    '    }' +
    '  }' +
    '  return "not_found";' +
    '})()'
  );
}

/**
 * "Model" 다이얼로그에서 특정 모델을 클릭한다.
 */
function clickModel(client, modelName) {
  return client.evaluate(
    '(function(){' +
    '  var target = ' + JSON.stringify(modelName) + ';' +
    '  var targetLower = target.toLowerCase();' +
    '  var dialogs = document.querySelectorAll("[role=dialog]");' +
    '  for(var i=0;i<dialogs.length;i++){' +
    '    var d = dialogs[i];' +
    '    var rect = d.getBoundingClientRect();' +
    '    if(rect.width===0) continue;' +
    '    if(d.textContent.indexOf("Conversation mode")>=0) continue;' +
    '    if(d.textContent.indexOf("Gemini")<0 && d.textContent.indexOf("Claude")<0 && d.textContent.indexOf("GPT")<0) continue;' +
    '    var els = d.querySelectorAll("span");' +
    '    for(var j=0;j<els.length;j++){' +
    '      var t = els[j].textContent.trim();' +
    '      if(t.toLowerCase()===targetLower){' +
    '        els[j].click(); return "selected:" + t;' +
    '      }' +
    '    }' +
    '  }' +
    '  return "not_found";' +
    '})()'
  );
}

/**
 * Escape 키로 설정 패널을 닫는다.
 */
function closePanel(client) {
  return client.sendCDP('Input.dispatchKeyEvent', {
    type: 'keyDown', key: 'Escape', code: 'Escape',
    windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27
  }).then(function() {
    return sleep(100);
  }).then(function() {
    return client.sendCDP('Input.dispatchKeyEvent', {
      type: 'keyUp', key: 'Escape', code: 'Escape',
      windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27
    });
  });
}

async function main() {
  var config = parseArgs();
  var client = cdp.createClient({ port: config.port });

  await client.connect();
  console.log('[연결] 안티그래비티 타겟 연결 성공');

  // 현재 상태 읽기
  var currentRaw = await client.evaluate(READ_CURRENT_EXPR);
  var current = JSON.parse(currentRaw);

  if (!current.mode && !current.model) {
    console.error('[에러] 채팅 패널에서 Mode/Model 버튼을 찾을 수 없습니다. 채팅 패널이 활성화되어 있는지 확인하세요.');
    client.close();
    process.exit(1);
  }

  console.log('[현재 설정]');
  console.log('  Conversation Mode: ' + (current.mode ? current.mode.text : '감지 불가'));
  console.log('  Model:             ' + (current.model ? current.model.text : '감지 불가'));

  // --list: 사용 가능한 옵션 목록 출력
  if (config.list) {
    var openResult = await openSettingsPanel(client);
    if (openResult === 'not_found') {
      console.error('[에러] 설정 패널을 열 수 없습니다.');
      client.close();
      process.exit(1);
    }
    await sleep(800);

    var modeOpts = JSON.parse(await readModeOptions(client));
    var modelOpts = JSON.parse(await readModelOptions(client));

    console.log('\n[사용 가능한 옵션]');
    console.log('\n  Conversation Modes:');
    modeOpts.forEach(function(m) { console.log('    - ' + m); });
    console.log('\n  Models:');
    modelOpts.forEach(function(m) { console.log('    - ' + m); });

    await closePanel(client);
    client.close();
    return;
  }

  // --mode 설정
  if (config.mode) {
    if (!current.mode) {
      console.error('[에러] Mode 버튼을 찾을 수 없습니다.');
    } else if (current.mode.text.toLowerCase() === config.mode.toLowerCase()) {
      console.log('\n[Mode] 이미 "' + current.mode.text + '"으로 설정되어 있습니다.');
    } else {
      var modeTarget = config.mode.charAt(0).toUpperCase() + config.mode.slice(1).toLowerCase();
      console.log('\n[Mode] "' + current.mode.text + '" → "' + modeTarget + '" 변경 중...');
      await openSettingsPanel(client);
      await sleep(800);
      var modeResult = await clickMode(client, config.mode);
      console.log('  결과: ' + modeResult);
      await sleep(500);
    }
  }

  // --model 설정
  if (config.model) {
    // mode 변경 후 현재 상태 다시 읽기
    currentRaw = await client.evaluate(READ_CURRENT_EXPR);
    current = JSON.parse(currentRaw);

    if (!current.model) {
      console.error('[에러] Model 버튼을 찾을 수 없습니다.');
    } else if (current.model.text.toLowerCase() === config.model.toLowerCase()) {
      console.log('\n[Model] 이미 "' + current.model.text + '"으로 설정되어 있습니다.');
    } else {
      console.log('\n[Model] "' + current.model.text + '" → "' + config.model + '" 변경 중...');
      await openSettingsPanel(client);
      await sleep(800);
      var modelResult = await clickModel(client, config.model);
      console.log('  결과: ' + modelResult);
      await sleep(500);
    }
  }

  // 변경 후 상태 확인
  await sleep(500);
  var afterRaw = await client.evaluate(READ_CURRENT_EXPR);
  var after = JSON.parse(afterRaw);
  console.log('\n[최종 설정]');
  console.log('  Conversation Mode: ' + (after.mode ? after.mode.text : '감지 불가'));
  console.log('  Model:             ' + (after.model ? after.model.text : '감지 불가'));

  client.close();
}

main().catch(function(e) { console.error('[에러]', e.message); process.exit(1); });
