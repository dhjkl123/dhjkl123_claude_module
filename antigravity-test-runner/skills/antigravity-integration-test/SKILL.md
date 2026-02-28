---
name: antigravity-integration-test
description: This skill should be used when the user asks to "run integration tests with Antigravity", "안티그래비티로 통합테스트", "test web pages with browser subagent", "automate browser testing via CDP", or mentions running integration tests on HTML/JSP pages through Google Antigravity IDE.
version: 1.0.0
---

# 안티그래비티 통합테스트 스킬

Google Antigravity IDE의 Browser Subagent를 활용하여 웹 프로젝트의 HTML/JSP 페이지들을 자동으로 통합 테스트합니다. CDP(Chrome DevTools Protocol)를 통해 프롬프트를 주입하고, 완료를 감지하고, 결과를 수집합니다.

## 사전 요구사항

- **Node.js**: 스크립트 실행을 위해 필요
- **ws 패키지**: `npm install ws` (유일한 외부 의존성)
- **Antigravity IDE**: `--remote-debugging-port=9222` 옵션으로 실행 중이어야 함
- **http-server**: `npx http-server`로 실행 (별도 설치 불필요)

## 스크립트 위치

모든 CDP 스크립트는 이 스킬의 `scripts/` 디렉토리에 있습니다:

```
scripts/
├── cdp-client.js   # 공유 CDP 클라이언트 라이브러리
├── cdp-send.js     # 프롬프트 주입 + 전송
├── cdp-poll.js     # 완료 폴링 + 알림
├── cdp-read.js     # 응답 콘텐츠 추출
└── cdp-status.js   # 상태 점검 (프리플라이트)
```

스크립트 경로 변수를 설정하세요:
```bash
SCRIPTS_DIR="$HOME/.claude/plugins/antigravity-test-runner/skills/antigravity-integration-test/scripts"
```

## 사용자 설정

스킬 시작 시 아래 3가지 항목을 사용자에게 확인합니다. 사용자가 별도로 지정하지 않으면 기본값을 사용합니다.

| 설정 항목 | 기본값 | 설명 |
|-----------|--------|------|
| CDP 포트 | `9222` | Antigravity IDE의 `--remote-debugging-port` 값 |
| 테스트 대상 URL | `http://localhost:8080` | 웹 페이지를 서빙하는 로컬 서버 주소 |
| 테스트 계획 형식 | `template` | `template` = `references/test-plan-template.md` 양식 사용, `custom` = 사용자가 직접 형식 지정 |
| 프로젝트 루트 | `.` (현재 디렉토리) | 테스트 대상 웹 프로젝트의 루트 디렉토리 경로. http-server가 이 경로에서 실행됨 |
| 승인 알림 비프음 | `disable` | `enable` = 승인(Always run/Allow) 필요 시 비프음으로 알림, `disable` = 비프음 끔 |

**진행 방식:**
1. 사용자의 요청에서 위 설정값이 명시되어 있으면 그대로 사용합니다.
2. 명시되지 않은 항목은 기본값을 적용합니다.
3. 설정을 확인한 뒤 이후 워크플로우의 모든 단계에서 해당 값을 일관되게 사용합니다.

예시:
- "포트 9333으로 통합테스트 해줘" → CDP 포트=9333, 나머지 기본값
- "http://localhost:3000 테스트, 보고서는 내 양식으로" → URL=http://localhost:3000, 형식=custom
- "비프음 켜고 통합테스트" → 비프음=enable, 나머지 기본값
- "C:/projects/my-app 프로젝트 테스트해줘" → 프로젝트 루트=C:/projects/my-app, 나머지 기본값
- "안티그래비티로 통합테스트" → 모두 기본값

## 워크플로우

### Step 0: 프리플라이트 점검 (GATE — 실패 시 스킬 종료)

CDP 연결이 정상인지, 안티그래비티 타겟이 존재하는지 확인합니다. **사용자 설정의 CDP 포트를 사용합니다.**

```bash
node "$SCRIPTS_DIR/cdp-status.js" --json --port $CDP_PORT
```

**이 단계는 게이트입니다.** 종료 코드가 0이 아니면 이후 단계를 진행하지 말고 스킬을 즉시 종료하세요.

- **종료 코드 1** (CDP 연결 실패): 사용자에게 아래 메시지를 전달하고 종료합니다.
  > Antigravity IDE가 CDP 포트에서 감지되지 않습니다. `--remote-debugging-port=9222` 옵션으로 IDE를 재시작한 뒤 다시 시도해 주세요.
- **종료 코드 2** (안티그래비티 타겟 없음): 사용자에게 아래 메시지를 전달하고 종료합니다.
  > Antigravity IDE는 실행 중이지만 채팅 패널이 활성화되지 않았습니다. IDE에서 채팅 패널을 열고 다시 시도해 주세요.
- **ws 모듈 없음** (`Cannot find module 'ws'`): 사용자에게 아래 메시지를 전달하고 종료합니다.
  > ws 패키지가 설치되지 않았습니다. `cd "$SCRIPTS_DIR" && npm install ws` 실행 후 다시 시도해 주세요.

**프리플라이트를 통과한 경우에만** Step 1로 진행합니다.

### Step 1: 테스트 계획 준비

프로젝트 루트에 `antigravity-integration-test/` 폴더를 생성하고, 테스트 계획을 md 파일로 정리하여 저장합니다. **스킬이 자체적으로 프로젝트를 분석하거나 테스트 계획을 생성하지 않습니다.**

```
$PROJECT_ROOT/
└── antigravity-integration-test/
    ├── test-plan.md          # 테스트 계획 (사용자 제공)
    └── viewport-prompt.md    # 뷰포트 설정 프롬프트 (자동 생성)
```

**진행 순서:**
1. `$PROJECT_ROOT/antigravity-integration-test/` 디렉토리가 없으면 생성합니다.
2. 사용자가 제공한 테스트 계획을 `test-plan.md`로 저장합니다.
   - 사용자가 파일 경로를 지정한 경우 → 해당 파일을 읽어서 `test-plan.md`로 복사
   - 사용자가 대화로 테스트 내용을 전달한 경우 → `test-plan.md`로 저장
   - 테스트 계획이 없으면 사용자에게 요청하고 대기
3. 뷰포트 설정 프롬프트를 `viewport-prompt.md`로 저장합니다 (Step 3에서 사용).

**테스트 계획 형식 설정에 따라:**
- `template`: `references/test-plan-template.md` 양식에 맞춰 `test-plan.md`를 구성합니다.
- `custom`: 사용자가 제공한 양식을 그대로 `test-plan.md`에 저장합니다.

### Step 2: 로컬 서버 시작

테스트 대상 페이지를 서빙할 HTTP 서버를 **프로젝트 루트 경로**에서 시작합니다.

```bash
npx http-server "$PROJECT_ROOT" -p 8080 -c-1
```

- `$PROJECT_ROOT`: 사용자 설정의 프로젝트 루트 경로 (기본값: `.`)
- `-c-1`: 캐시 비활성화 (테스트 시 최신 파일 보장)
- 백그라운드로 실행하고 PID를 기록

서버 시작 후 `$TEST_BASE_URL`에서 페이지 접근 가능한지 확인합니다.

### Step 3: 뷰포트 설정 프롬프트 전송

`antigravity-integration-test/viewport-prompt.md` 파일을 읽어서 안티그래비티에 전송합니다.

Step 1에서 파일이 아직 없으면 아래 내용으로 자동 생성합니다:
```
Set the browser viewport to 1920x1080 pixels. After setting, confirm the viewport dimensions.
```

```bash
node "$SCRIPTS_DIR/cdp-send.js" "$PROJECT_ROOT/antigravity-integration-test/viewport-prompt.md" --port $CDP_PORT
```

뷰포트 설정이 완료될 때까지 잠시 대기합니다 (보통 10-15초).

### Step 4: 테스트 프롬프트 주입

`antigravity-integration-test/test-plan.md` 파일을 읽어서 안티그래비티에 전송합니다.

```bash
node "$SCRIPTS_DIR/cdp-send.js" "$PROJECT_ROOT/antigravity-integration-test/test-plan.md" --port $CDP_PORT
```

**주의사항:**
- 프롬프트가 매우 긴 경우 (10,000자+) ClipboardEvent paste가 느릴 수 있으므로 대기 시간 증가
- 프롬프트에 백틱, 큰따옴표 등 특수문자가 포함되어도 JSON.stringify로 안전하게 이스케이프됨

### Step 5: 완료 대기 (폴링)

테스트 실행 완료를 자동으로 감지합니다.

```bash
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT
```

비프음이 활성화된 경우 `--beep` 플래그를 추가합니다:
```bash
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT --beep
```

폴링 동작:
- **15초 간격**으로 상태 점검 (변경: `--interval 15`)
- **Cancel 버튼 카운트**로 실행 상태 감지 (Cancel>0 = 실행 중)
- **Always run / Always Allow** 감지 시 콘솔에 `!! 승인필요` 출력. `--beep` 플래그가 있으면 추가로 비프음 발생
- **완료 조건**: Cancel=0 + 텍스트>1000자 + 2회 연속 동일 길이
- 완료 시 결과를 자동으로 파일에 저장

커스텀 설정:
```bash
node "$SCRIPTS_DIR/cdp-poll.js" --interval 10 --max-polls 200 --output my-result.txt --port $CDP_PORT --beep
```

**승인 대기 알림이 발생하면:**
1. Antigravity IDE 창으로 전환
2. "Always run" 또는 "Always Allow" 버튼 클릭
3. 폴링이 자동으로 재개됨

### Step 6: 결과 수집

테스트가 완료되면 결과를 읽어옵니다. (Step 5에서 자동 저장되지만, 수동으로도 가능)

```bash
node "$SCRIPTS_DIR/cdp-read.js" --output test-result.txt --port $CDP_PORT
```

특정 길이로 제한:
```bash
node "$SCRIPTS_DIR/cdp-read.js" --max-length 8000 --port $CDP_PORT
```

### Step 7: 보고서 정리

결과 파일을 분석하여 테스트 보고서를 작성합니다.

보고서 형식:
```
## 통합테스트 결과 요약

- 총 테스트: N개
- 통과: N개 (XX%)
- 실패: N개 (XX%)

### 실패 항목
| TC ID | 페이지 | 항목 | 실패 사유 |
|-------|--------|------|-----------|
| TC-xxx | page.html | 검증항목 | 상세사유 |

### 스크린샷
- 안티그래비티 IDE의 스크린샷 저장 경로 안내
```

## 핵심 기술 패턴 (보존 필수)

1. **Lexical 에디터 선택**: `editors[editors.length - 1]` (마지막 에디터 = 채팅 입력란, 첫 번째는 검색창)
2. **텍스트 주입**: `ClipboardEvent("paste")` 만 작동 (`execCommand`, `Input.insertText` 모두 실패함)
3. **프롬프트 이스케이프**: `JSON.stringify(PROMPT)` 후 eval 표현식에 직접 삽입
4. **버튼 텍스트**: "Send" (유휴) / "Submit" (실행 중) / "전송" (한국어)
5. **완료 감지**: Cancel=0 + textLen>1000 + stableCount>=2
6. **비프음**: PowerShell `[console]::beep()` (Windows), `\x07` (크로스플랫폼 폴백)
7. **채팅 영역 탐색**: `overflowY=auto|scroll` + `scrollHeight>500` → textContent 길이 정렬 → 첫 번째

## 트러블슈팅

자세한 내용은 `references/troubleshooting.md`를 참조하세요.

| 증상 | 원인 | 해결 |
|------|------|------|
| CDP 연결 실패 | IDE 미실행 또는 포트 미설정 | `--remote-debugging-port=9222`로 재시작 |
| 타겟 없음 | 채팅 패널 미활성 | IDE에서 채팅 패널 열기 |
| 텍스트 주입 0자 | 에디터 포커스 실패 | 에디터 클릭 후 재시도 |
| 폴링 타임아웃 | 승인 대기 또는 느린 응답 | 수동 승인 또는 `--max-polls` 증가 |
