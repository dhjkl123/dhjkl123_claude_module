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
├── cdp-client.js    # 공유 CDP 클라이언트 라이브러리
├── cdp-config.js    # Conversation Mode / Model 설정
├── cdp-send.js      # 프롬프트 주입 + 전송
├── cdp-poll.js      # 완료 폴링 + 알림
├── cdp-approve.js   # 승인 버튼 대리 클릭
├── cdp-read.js      # 응답 콘텐츠 추출
└── cdp-status.js    # 상태 점검 (프리플라이트)
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
| 프로젝트 루트 | `.` (현재 디렉토리) | 테스트 대상 웹 프로젝트의 루트 디렉토리 경로. http-server가 이 경로에서 실행됨 |
| 승인 알림 비프음 | `disable` | `enable` = 승인(Always run/Allow) 필요 시 비프음으로 알림, `disable` = 비프음 끔 |
| 승인 방식 | `ask` | `auto` = "Always run" / "Always Allow" 버튼을 자동 클릭, `ask` = 사용자에게 확인 후 대리 클릭 |
| 보고서 형식 | `template` | `template` = `references/test-report-template.md` 양식 사용, `custom` = 사용자가 지정한 양식 사용 |
| Conversation Mode | `planning` | `planning` = 계획 수립 후 실행 (깊은 리서치/복잡한 작업), `fast` = 즉시 실행 (간단한 작업) |
| Model | `(현재 설정 유지)` | 안티그래비티에서 사용할 AI 모델. `--list`로 사용 가능한 목록 확인. 미지정 시 현재 IDE에 설정된 모델 유지 |

**진행 방식:**
1. 사용자의 요청에서 위 설정값이 명시되어 있으면 그대로 사용합니다.
2. 명시되지 않은 항목은 기본값을 적용합니다.
3. 설정을 확인한 뒤 이후 워크플로우의 모든 단계에서 해당 값을 일관되게 사용합니다.

예시:
- "포트 9333으로 통합테스트 해줘" → CDP 포트=9333, 나머지 기본값
- "http://localhost:3000 테스트" → URL=http://localhost:3000, 나머지 기본값
- "보고서는 내 양식으로" → 보고서 형식=custom (사용자에게 양식 파일 경로 요청)
- "비프음 켜고 통합테스트" → 비프음=enable, 나머지 기본값
- "C:/projects/my-app 프로젝트 테스트해줘" → 프로젝트 루트=C:/projects/my-app, 나머지 기본값
- "Claude로 Fast 모드로 테스트해줘" → Mode=fast, Model=Claude Sonnet 4.6 (Thinking)
- "자동승인으로 통합테스트" → 승인 방식=auto, 나머지 기본값
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

**프리플라이트를 통과한 경우에만** Step 0.5로 진행합니다.

### Step 0.5: Conversation Mode / Model 설정 (선택)

사용자가 Conversation Mode 또는 Model을 지정한 경우에만 실행합니다. 미지정 시 이 단계를 건너뛰고 현재 IDE 설정을 그대로 사용합니다.

```bash
# 현재 설정 및 사용 가능한 옵션 확인
node "$SCRIPTS_DIR/cdp-config.js" --list --port $CDP_PORT

# Mode만 변경
node "$SCRIPTS_DIR/cdp-config.js" --mode fast --port $CDP_PORT

# Model만 변경
node "$SCRIPTS_DIR/cdp-config.js" --model "Claude Sonnet 4.6 (Thinking)" --port $CDP_PORT

# Mode + Model 동시 변경
node "$SCRIPTS_DIR/cdp-config.js" --mode planning --model "Gemini 3.1 Pro (High)" --port $CDP_PORT
```

**사용 가능한 값:**
- Conversation Mode: `planning`, `fast`
- Model: `cdp-config.js --list`로 확인 (IDE 버전에 따라 목록이 달라질 수 있음)

**주의사항:**
- 설정 패널을 열고 클릭하는 방식이므로, 다른 CDP 스크립트와 동시에 실행하지 마세요.
- 설정 변경 후 스크립트가 자동으로 변경 결과를 확인하여 출력합니다.

### Step 1: 테스트 계획 확인

사용자가 제공한 테스트 계획 파일을 확인합니다. 안티그래비티가 이 파일을 직접 읽어서 테스트를 수행합니다. **이 스킬은 테스트 계획을 생성하지 않습니다.**

```
$PROJECT_ROOT/
└── antigravity-integration-test/
    └── test-plan.md          # 테스트 계획 (사용자 제공)
```

**진행 순서:**
1. `$PROJECT_ROOT/antigravity-integration-test/` 디렉토리가 없으면 생성합니다.
2. 사용자가 제공한 테스트 계획을 `test-plan.md`로 저장합니다.
   - 사용자가 파일 경로를 지정한 경우 → 해당 파일을 `test-plan.md`로 복사
   - 사용자가 대화로 테스트 내용을 전달한 경우 → `test-plan.md`로 저장
   - 테스트 계획이 없으면 사용자에게 요청하고 대기
3. `test-plan.md`가 존재하는지 확인한 후 다음 단계로 진행합니다.

**test-plan.md 작성 시 주의사항 (사용자 안내용):**
- **"viewport"라는 단어는 사용하지 마세요.** 브라우저 서브에이전트가 viewport 변경을 시도하면서 페이지 이탈이 발생할 수 있습니다.
- 스크린샷 해상도 지시는 `Take a screenshot at 1920x1080 resolution`으로 작성합니다.

### Step 2: 로컬 서버 시작

테스트 대상 페이지를 서빙할 HTTP 서버를 **프로젝트 루트 경로**에서 시작합니다.

```bash
npx http-server "$PROJECT_ROOT" -p 8080 -c-1
```

- `$PROJECT_ROOT`: 사용자 설정의 프로젝트 루트 경로 (기본값: `.`)
- `-c-1`: 캐시 비활성화 (테스트 시 최신 파일 보장)
- 백그라운드로 실행하고 PID를 기록

서버 시작 후 `$TEST_BASE_URL`에서 페이지 접근 가능한지 확인합니다.

### Step 3: 테스트 프롬프트 주입

테스트 계획 파일의 **내용을 직접 전송하지 않습니다.** 대신 안티그래비티에게 해당 파일을 읽고 테스트를 수행하라는 짧은 프롬프트를 주입합니다.

```bash
node "$SCRIPTS_DIR/cdp-send.js" --text "Read the test plan at antigravity-integration-test/test-plan.md and execute all test cases described in it. Take screenshots at 1920x1080 resolution. Report results for each TC as: TC-XXX: PASS/FAIL - [details]" --port $CDP_PORT
```

**왜 파일 경로를 전달하는가:**
- 안티그래비티 IDE가 프로젝트 폴더를 열고 있으므로 프로젝트 내 파일에 직접 접근 가능
- 긴 테스트 계획도 paste 길이 제한 없이 전달 가능
- 안티그래비티가 파일을 직접 읽고 해석하므로 마크다운 서식이 보존됨

**프롬프트 커스텀:**
- 사용자가 추가 지시사항을 요청한 경우 프롬프트에 포함합니다.
- 예: `"... Also focus on form validation and check for console errors."`

### Step 4: 완료 대기 (폴링)

테스트 실행 완료를 자동으로 감지합니다. **승인 방식 설정에 따라 실행 방법이 다릅니다.**

#### 승인 방식 = `auto` (자동 승인)

승인 요청을 자동으로 처리합니다. 사용자 개입 없이 완료까지 실행됩니다.

```bash
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT --auto-approve
```

#### 승인 방식 = `ask` (사용자 확인 후 대리 클릭) — 기본값

`--exit-on-approve` 플래그로 폴링을 실행합니다. 승인이 필요하면 종료 코드 3으로 종료되므로, **아래 루프를 반복합니다:**

```
반복:
  1. cdp-poll.js --exit-on-approve 실행 (백그라운드)
  2. 종료 코드 확인:
     - 종료 코드 0 → 테스트 완료, 루프 탈출
     - 종료 코드 3 → 승인 필요, 3단계로
     - 종료 코드 1 → 타임아웃/에러, 사용자에게 알림
  3. 사용자에게 승인 여부를 질문 (AskUserQuestion 사용)
     - 승인 → cdp-approve.js 실행 → 1단계로 돌아가 폴링 재시작
     - 거부 → 사용자에게 상황 설명 후 대응
```

**폴링 실행:**
```bash
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT --exit-on-approve
```

**종료 코드 3 발생 시 — 사용자에게 질문:**
> 안티그래비티에서 승인을 요청하고 있습니다 (Always run / Always Allow). 승인하시겠습니까?

**사용자가 승인하면 — 대리 클릭:**
```bash
node "$SCRIPTS_DIR/cdp-approve.js" --port $CDP_PORT
```

승인 후 폴링을 다시 시작합니다 (위 루프의 1단계).

#### 공통 옵션

비프음이 활성화된 경우 `--beep` 플래그를 추가합니다:
```bash
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT --exit-on-approve --beep
```

폴링 동작:
- **15초 간격**으로 상태 점검 (변경: `--interval 15`)
- **Cancel 버튼 카운트**로 실행 상태 감지 (Cancel>0 = 실행 중)
- **완료 조건**: Cancel=0 + 텍스트>1000자 + 2회 연속 동일 길이
- 완료 시 결과를 자동으로 파일에 저장

커스텀 설정:
```bash
node "$SCRIPTS_DIR/cdp-poll.js" --interval 10 --max-polls 200 --output my-result.txt --port $CDP_PORT --exit-on-approve --beep
```

### Step 5: 결과 수집

테스트가 완료되면 결과를 읽어옵니다. (Step 4에서 자동 저장되지만, 수동으로도 가능)

```bash
node "$SCRIPTS_DIR/cdp-read.js" --output test-result.txt --port $CDP_PORT
```

특정 길이로 제한:
```bash
node "$SCRIPTS_DIR/cdp-read.js" --max-length 8000 --port $CDP_PORT
```

### Step 6: 보고서 정리

Step 5에서 수집한 raw 결과 파일(`test-result.txt`)을 분석하고, 스크린샷을 수집하여 마크다운 보고서를 작성합니다.

**진행 순서:**
1. `test-result.txt`를 읽고, CSS 아티팩트 / "Thought for Ns" 등 노이즈를 무시하여 테스트 결과만 추출합니다.
2. 스크린샷 파일을 수집합니다:
   - **스크린샷 저장 경로**: `~/.gemini/antigravity/brain/{session-id}/`
   - 가장 최근 세션 폴더에서 `*.png` 파일을 찾습니다.
   - 찾은 스크린샷을 `$PROJECT_ROOT/antigravity-integration-test/screenshots/`로 복사합니다.
3. 보고서 형식 설정에 따라 `test-report.md`를 생성합니다.
4. 사용자에게 보고서 요약을 출력하고, 파일 경로를 안내합니다.

**스크린샷 수집 명령:**
```bash
# 최근 세션 폴더 찾기
BRAIN_DIR="$HOME/.gemini/antigravity/brain"
SESSION_DIR=$(ls -td "$BRAIN_DIR"/*/ 2>/dev/null | head -1)

# 스크린샷 복사
mkdir -p "$PROJECT_ROOT/antigravity-integration-test/screenshots"
cp "$SESSION_DIR"/*.png "$PROJECT_ROOT/antigravity-integration-test/screenshots/" 2>/dev/null
```

**보고서 형식 설정에 따라:**
- `template` (기본값): `references/test-report-template.md` 양식에 맞춰 보고서를 생성합니다.
- `custom`: 사용자가 지정한 양식 파일을 참고하여 보고서를 생성합니다.

**보고서 내 이미지 참조:**
- 복사한 스크린샷을 상대 경로로 포함합니다.
- 예: `![TC-001 메인 페이지](./screenshots/tc001_main_page_1772285055973.png)`
- TC ID와 스크린샷 파일명을 매칭하여 각 TC 상세 섹션에 삽입합니다.

**결과 파일 구조:**
```
$PROJECT_ROOT/
└── antigravity-integration-test/
    ├── test-plan.md
    ├── test-result.txt
    ├── test-report.md
    └── screenshots/
        ├── tc001_main_page_xxx.png
        ├── tc002_about_page_xxx.png
        └── tc003_contact_xxx.png
```

**주의사항:**
- raw 결과에서 TC별 PASS/FAIL 판정과 상세 사유를 정확히 추출하세요.
- 결과가 중복 출력된 경우 (안티그래비티가 여러 번 응답) 마지막 결과를 기준으로 합니다.
- 보고서 파일명은 항상 `test-report.md`로 고정합니다.

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
