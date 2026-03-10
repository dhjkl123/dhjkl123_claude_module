# Step 0: 사용자 설정 확인 + 프리플라이트 점검 (GATE — 실패 시 스킬 종료)

## 0-1. 사용자 설정 확인

프리플라이트 전에 **반드시 AskUserQuestion 도구를 사용하여** 아래 설정을 사용자에게 질문합니다. 사용자의 요청에서 이미 명시된 값이 있으면 해당 값을 기본 선택지로 제시하되, 나머지 항목도 함께 물어봅니다.

**질문할 설정 항목:**

| 설정 항목 | 기본값 | 선택지 |
|-----------|--------|--------|
| CDP 포트 | `9222` | `9222` / 직접 입력 |
| 테스트 대상 URL | `http://localhost:8080` | `http://localhost:8080` / `http://localhost:3000` / 직접 입력 |
| Conversation Mode | `planning` | `planning` (계획 수립 후 실행, 복잡한 프로젝트 추천) / `fast` (바로 실행, 단순 HTML 추천) |
| 테스트 계획 형식 | `template` | `template` (기본 양식) / `custom` (사용자 양식) |
| 프로젝트 루트 | `.` (현재 디렉토리) | `.` / 직접 입력 |
| 스크린샷 해상도 | `auto` | `auto` (주모니터 해상도 자동 감지) / `1920x1080` / `1280x720` / 직접 입력 |
| 승인 처리 방식 | `ask` | `auto` (자동 클릭) / `ask` (물어본 뒤 처리) / `manual` (사용자가 직접 IDE에서 클릭) |
| 승인 알림 비프음 | `disable` | `disable` / `enable` |

AskUserQuestion은 한 번에 최대 4개 질문까지 가능하므로, 관련 항목을 묶어서 2회에 나눠 질문합니다:
- **1회차**: CDP 포트, 테스트 대상 URL, 프로젝트 루트, 스크린샷 해상도
- **2회차**: Conversation Mode, 테스트 계획 형식, 승인 처리 방식, 승인 알림 비프음

사용자가 모든 설정에 응답하면 확정하고, 이후 단계에서 일관되게 사용합니다.

## 0-2. Antigravity IDE 실행

사용자 설정이 확정되면 Antigravity IDE를 CDP 포트와 함께 실행합니다:

```bash
antigravity --remote-debugging-port=$CDP_PORT &
```

IDE가 준비될 때까지 약 5초 대기합니다.

## 0-3. 프리플라이트 점검

IDE 실행 후 CDP 연결과 안티그래비티 타겟을 검증합니다.

```bash
node "$SCRIPTS_DIR/cdp-status.js" --json --port $CDP_PORT
```

### 종료 코드별 처리

- **종료 코드 0** (정상): 다음 단계로 진행합니다.

- **종료 코드 1** (CDP 연결 실패):
  IDE가 아직 준비되지 않았을 수 있으므로 5초 추가 대기 후 1회 재시도합니다.
  재시도에도 실패하면 사용자에게 안내하고 스킬을 종료합니다:
  > Antigravity IDE를 실행했지만 CDP 연결이 되지 않습니다. IDE가 정상 실행되었는지 확인해 주세요.

- **종료 코드 2** (안티그래비티 타겟 없음):
  사용자에게 아래 메시지를 전달하고 스킬을 종료합니다:
  > Antigravity IDE는 실행 중이지만 채팅 패널이 활성화되지 않았습니다. IDE에서 채팅 패널을 열고 다시 시도해 주세요.

- **ws 모듈 없음** (`Cannot find module 'ws'`):
  자동으로 설치를 시도합니다:
  ```bash
  cd "$SCRIPTS_DIR" && npm install ws
  ```
  설치 후 프리플라이트를 재시도합니다. 설치 실패 시 사용자에게 안내하고 종료합니다.

**프리플라이트를 통과한 경우에만** 다음 단계로 진행합니다.

## 0-4. Conversation Mode 설정

프리플라이트 통과 후, 사용자가 선택한 Conversation Mode를 안티그래비티에 적용합니다:

```bash
node "$SCRIPTS_DIR/cdp-config.js" --mode $CONVERSATION_MODE --port $CDP_PORT
```

이미 해당 모드로 설정되어 있으면 변경 없이 통과됩니다.

---
**다음 →** [Step 1: 테스트 계획 준비](step-1-test-plan.md)
