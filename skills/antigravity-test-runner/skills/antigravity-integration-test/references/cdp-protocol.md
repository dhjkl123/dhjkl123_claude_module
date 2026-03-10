# CDP 프로토콜 레퍼런스

## 연결 프로토콜

### 타겟 탐색

```
GET http://127.0.0.1:{port}/json
```

응답: JSON 배열. 각 항목은 브라우저 타겟 정보를 포함합니다.

```json
[
  {
    "id": "...",
    "title": "Antigravity - Project Name",
    "type": "page",
    "url": "...",
    "webSocketDebuggerUrl": "ws://127.0.0.1:9222/devtools/page/..."
  }
]
```

### 타겟 필터

```javascript
targets.find(function(t) {
  return t.title && t.title.includes('Antigravity') && t.type === 'page';
});
```

- `title`에 "Antigravity" 포함 여부로 판별
- `type === 'page'` 조건으로 확장 프로그램/서비스 워커 제외

### WebSocket 연결

```javascript
var ws = new WebSocket(target.webSocketDebuggerUrl);
```

- Node.js 환경에서 `ws` 패키지 사용 (브라우저 WebSocket API와 호환)
- 연결 후 `open` 이벤트에서 CDP 명령 전송 가능

### JSON-RPC 통신

요청:
```json
{
  "id": 1,
  "method": "Runtime.evaluate",
  "params": {
    "expression": "...",
    "returnByValue": true
  }
}
```

응답:
```json
{
  "id": 1,
  "result": {
    "result": {
      "type": "string",
      "value": "..."
    }
  }
}
```

### 메시지 ID 관리

자동 증가 카운터 + 응답별 핸들러 등록/제거 패턴:

```javascript
var msgId = 0;

function sendCDP(method, params) {
  var id = ++msgId;
  return new Promise(function(resolve) {
    var handler = function(raw) {
      var msg = JSON.parse(raw.toString());
      if (msg.id === id) {
        ws.removeListener('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: id, method: method, params: params }));
  });
}
```

## Lexical 에디터 주입 패턴

### 에디터 선택

```javascript
var editors = document.querySelectorAll("[data-lexical-editor]");
var chatEditor = editors.length > 1 ? editors[editors.length - 1] : editors[0];
```

- 안티그래비티 UI에 여러 Lexical 에디터가 존재할 수 있음
- 첫 번째 에디터: 검색창 (사용하지 않음)
- **마지막 에디터**: 채팅 입력란 (프롬프트 주입 대상)

### 텍스트 주입 방식

**작동하는 방식 (ClipboardEvent paste):**

```javascript
var editor = editors[editors.length - 1];
editor.focus();
var d = new DataTransfer();
d.setData("text/plain", promptText);
var ev = new ClipboardEvent("paste", {
  bubbles: true,
  cancelable: true,
  clipboardData: d
});
editor.dispatchEvent(ev);
```

**작동하지 않는 방식들:**
- `document.execCommand('insertText', false, text)` - Lexical이 무시함
- `Input.insertText` CDP 명령 - 간헐적으로만 동작
- `InputEvent('beforeinput')` - 상태 업데이트 안 됨
- `editor.textContent = text` - Lexical 내부 상태와 불일치

### 프롬프트 이스케이프

```javascript
var escaped = JSON.stringify(PROMPT);
// 이후 eval 표현식에서:
'd.setData("text/plain", ' + escaped + ');'
```

`JSON.stringify`가 다음을 자동 처리:
- 줄바꿈 (`\n`), 탭 (`\t`)
- 큰따옴표 (`\"`)
- 백슬래시 (`\\`)
- 유니코드 이스케이프

### 전송 버튼

```javascript
// 버튼 텍스트에 따라 탐색
var buttonTexts = ["Send", "Submit", "전송"];
document.querySelectorAll("button").forEach(function(btn) {
  var t = btn.textContent.trim();
  if (buttonTexts.indexOf(t) >= 0) btn.click();
});
```

- "Send": 에이전트 유휴 상태
- "Submit": 에이전트 실행 중 (추가 프롬프트 전송 가능)
- "전송": 한국어 UI 설정 시

폴백: Enter 키 전송
```javascript
sendCDP('Input.dispatchKeyEvent', {
  type: 'keyDown', key: 'Enter', code: 'Enter',
  windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13
});
```

## 대화 영역 탐색

### 스크롤 영역 탐색

```javascript
var scrollAreas = [];
document.querySelectorAll('div').forEach(function(el) {
  var style = getComputedStyle(el);
  if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > 500) {
    scrollAreas.push(el);
  }
});
scrollAreas.sort(function(a, b) {
  return b.textContent.length - a.textContent.length;
});
var chatArea = scrollAreas[0]; // 가장 긴 텍스트를 포함하는 스크롤 영역
```

### CSS 아티팩트 제거

안티그래비티가 CSS를 주입하므로 textContent에 불필요한 CSS 규칙이 포함될 수 있음:

```javascript
text = text.replace(/\/\* Copied from[\s\S]*?\*\//g, '');
text = text.replace(/@media \(prefers-color-scheme:[\s\S]*?\}\s*\}/g, '');
text = text.replace(/\.[a-zA-Z_-]+\s*\{[^}]*\}/g, '');
```

## 알려진 제약사항

1. **단일 탭**: CDP는 한 번에 하나의 WebSocket 연결만 타겟에 연결 가능 (cdp-poll.js는 매 폴링마다 새 연결)
2. **returnByValue 크기 제한**: 매우 큰 문자열 (수 MB) 반환 시 잘릴 수 있음
3. **포커스 요구**: ClipboardEvent paste는 에디터가 포커스된 상태에서만 동작
4. **타이밍**: 에디터 클릭 후 약 500ms 대기 필요 (Lexical 내부 상태 업데이트)
5. **포트 충돌**: 다른 Chrome 인스턴스가 같은 디버깅 포트를 사용할 수 있음
