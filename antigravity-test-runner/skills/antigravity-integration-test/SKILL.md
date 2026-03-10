---
name: antigravity-integration-test
description: This skill should be used when the user asks to "run integration tests with Antigravity", "안티그래비티로 통합테스트", "test web pages with browser subagent", "automate browser testing via CDP", or mentions running integration tests on HTML/JSP pages through Google Antigravity IDE.
version: 1.0.0
---

# 안티그래비티 통합테스트 스킬

Google Antigravity IDE의 Browser Subagent를 활용하여 웹 프로젝트의 HTML/JSP 페이지들을 자동으로 통합 테스트합니다. CDP(Chrome DevTools Protocol)를 통해 프롬프트를 주입하고, 완료를 감지하고, 결과를 수집합니다.

## 사전 요구사항

- **Node.js**: 스크립트 실행을 위해 필요
- **ws 패키지**: 없으면 프리플라이트에서 자동 설치
- **Antigravity IDE**: 미실행 시 프리플라이트에서 CDP 포트와 함께 자동 실행
- **http-server**: `npx http-server`로 실행 (별도 설치 불필요)

## 스크립트 위치

모든 CDP 스크립트는 이 스킬의 `scripts/` 디렉토리에 있습니다:

```
scripts/
├── cdp-client.js   # 공유 CDP 클라이언트 라이브러리
├── cdp-send.js     # 프롬프트 주입 + 전송
├── cdp-poll.js     # 완료 폴링 + 알림
├── cdp-approve.js  # 승인 버튼 대리 클릭
├── cdp-config.js   # Conversation Mode / Model 설정
├── cdp-read.js     # 응답 콘텐츠 추출
└── cdp-status.js   # 상태 점검 (프리플라이트)
```

스크립트 경로 변수를 설정하세요:
```bash
SCRIPTS_DIR="$HOME/.claude/skills/antigravity-integration-test/scripts"
```

## 사용자 설정

스킬 시작 시 **반드시 AskUserQuestion 도구를 사용하여** 아래 설정을 사용자에게 확인합니다. 사용자의 요청에 값이 명시되어 있더라도, 확인 질문을 통해 모든 설정을 한 번에 보여주고 확정합니다.

| 설정 항목 | 기본값 | 설명 |
|-----------|--------|------|
| CDP 포트 | `9222` | Antigravity IDE의 `--remote-debugging-port` 값 |
| 테스트 대상 URL | `http://localhost:8080` | 웹 페이지를 서빙하는 로컬 서버 주소 |
| Conversation Mode | `planning` | `planning` = 계획 수립 후 실행 (복잡한 프로젝트, 서버 직접 관리 필요 시 추천), `fast` = 바로 실행 (단순 HTML, 서버 이미 실행 중일 때 추천) |
| 테스트 계획 형식 | `template` | `template` = `references/test-plan-template.md` 양식 사용, `custom` = 사용자가 직접 형식 지정 |
| 프로젝트 루트 | `.` (현재 디렉토리) | 테스트 대상 웹 프로젝트의 루트 디렉토리 경로. http-server가 이 경로에서 실행됨 |
| 스크린샷 해상도 | `auto` (주모니터 해상도) | 스크린샷 촬영 시 브라우저 전체화면 해상도. `auto` = 주모니터 해상도 자동 감지, 또는 `1920x1080` 형식으로 직접 지정 |
| 승인 처리 방식 | `ask` | `auto` = 승인 감지 시 자동 클릭, `ask` = 사용자에게 물어본 뒤 처리, `manual` = 사용자가 직접 IDE에서 클릭 |
| 승인 알림 비프음 | `disable` | `enable` = 승인(Always run/Allow) 필요 시 비프음으로 알림, `disable` = 비프음 끔 |

**진행 방식:**
1. 워크플로우 시작 전, AskUserQuestion으로 모든 설정 항목을 사용자에게 질문합니다.
2. 사용자의 요청에서 일부 값이 이미 명시된 경우, 해당 값을 기본 선택지로 제시하되 나머지 항목도 함께 물어봅니다.
3. 사용자가 응답한 뒤 설정을 확정하고, 이후 워크플로우의 모든 단계에서 해당 값을 일관되게 사용합니다.

## 워크플로우

각 단계는 개별 md 파일로 분리되어 있으며, 각 파일 하단에서 다음 단계를 안내합니다.

**중요: 스텝 파일은 해당 단계를 실행할 때만 읽습니다.** 스킬 시작 시 모든 스텝 파일을 미리 읽지 마세요. 현재 진행할 스텝의 md 파일만 읽고 실행한 뒤, 다음 스텝으로 넘어갈 때 다음 파일을 읽습니다.

| Step | 파일 | 설명 |
|------|------|------|
| 0 | [step-0-preflight.md](steps/step-0-preflight.md) | 사용자 설정 + IDE 실행 + 프리플라이트 점검 (GATE) |
| 1 | [step-1-test-plan.md](steps/step-1-test-plan.md) | 테스트 계획 준비 |
| 2 | [step-2-inject.md](steps/step-2-inject.md) | 테스트 프롬프트 주입 |
| 3 | [step-3-poll.md](steps/step-3-poll.md) | 완료 대기 (폴링) |
| 4 | [step-4-read.md](steps/step-4-read.md) | 결과 수집 |
| 5 | [step-5-report.md](steps/step-5-report.md) | 보고서 정리 |

**시작 →** [Step 0: 프리플라이트 점검](steps/step-0-preflight.md)

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
