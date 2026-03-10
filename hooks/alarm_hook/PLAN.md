# Claude Code 알람 Hook 구현 계획

## 목표
1. **작업 완료 시 터미널 창이 작업표시줄에서 깜빡임** (Windows FlashWindow API)
2. **사용자가 "알람해줘" 요청 시에도 깜빡임 발동**
3. **사용자가 "알림 꺼줘/켜줘"로 알림 온오프 제어**
4. **선택적으로 Teams/Slack 웹훅으로 알림 전송**

## 사용할 Claude Code Hook 이벤트

| 이벤트 | 용도 |
|--------|------|
| `Stop` | Claude가 응답을 완료할 때 발동 → 작업표시줄 깜빡임 |
| `Notification` | Claude Code가 알림을 보낼 때 발동 |
| `UserPromptSubmit` | 사용자 입력에서 "알림 꺼줘/켜줘" 키워드 감지 → config.json 자동 수정 |

## 프로젝트 구조

```
C:\Users\KTDS\alarm_hook\
├── PLAN.md                 # 이 문서
├── flash_taskbar.ps1       # PowerShell - 작업표시줄 깜빡임
├── notify.sh               # 메인 알림 훅 스크립트 (Stop, Notification 이벤트용)
├── prompt_handler.sh       # 사용자 입력 키워드 감지 스크립트 (UserPromptSubmit 이벤트용)
├── setup.sh                # 대화형 초기 설정 스크립트
├── config.json             # 글로벌 설정 (알림 온오프, 웹훅 URL 등)
└── send_message.sh         # Teams/Slack/Discord 메시지 전송 스크립트
```

## 설정 파일 (`config.json`)

```json
{
  "flash_taskbar": true,
  "flash_on_every_response": false,
  "teams_webhook_url": "",
  "slack_webhook_url": "",
  "discord_webhook_url": "",
  "notification_message": "Claude Code 작업이 완료되었습니다."
}
```

| 옵션 | 설명 |
|------|------|
| `flash_taskbar` | 알림 마스터 스위치. false면 모든 깜빡임 비활성화 |
| `flash_on_every_response` | true면 매 응답마다 깜빡임, false면 Notification 이벤트에서만 깜빡임 |
| `teams_webhook_url` | Teams Incoming Webhook URL (비어있으면 미사용) |
| `slack_webhook_url` | Slack Incoming Webhook URL (비어있으면 미사용) |
| `discord_webhook_url` | Discord Webhook URL (비어있으면 미사용) |
| `notification_message` | 메신저로 보낼 기본 메시지 |

## 구현 단계

### 1단계: 작업표시줄 깜빡임 스크립트 (`flash_taskbar.ps1`)
- Windows API `FlashWindowEx`를 호출하는 PowerShell 스크립트
- 현재 터미널(콘솔 호스트) 윈도우를 찾아 깜빡이게 함

### 2단계: 설정 파일 (`config.json`)
- 글로벌 설정 파일 생성
- 사용자가 직접 편집하거나, 키워드 명령으로 자동 수정

### 3단계: 메인 알림 스크립트 (`notify.sh`)
- stdin으로 들어오는 훅 JSON 파싱
- `config.json` 읽어서 활성화된 알림 채널 확인
- 조건에 따라 작업표시줄 깜빡임 실행
- Teams/Slack 웹훅 호출 (설정된 경우)

### 4단계: 사용자 입력 핸들러 (`prompt_handler.sh`)
- `UserPromptSubmit` 이벤트에서 사용자 입력 텍스트를 받음
- "알림 꺼줘", "알림 켜줘" 등 키워드 매칭
- 매칭 시 `config.json`의 `flash_taskbar` 값을 자동 수정
- 키워드 목록:
  - 끄기: `알림 꺼`, `알람 꺼`, `알림 off`, `alarm off`
  - 켜기: `알림 켜`, `알람 켜`, `알림 on`, `alarm on`

### 5단계: Claude Code 설정에 훅 등록
`~/.claude/settings.json`에 추가:
```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "bash C:/Users/KTDS/alarm_hook/notify.sh"
      }]
    }],
    "Notification": [{
      "hooks": [{
        "type": "command",
        "command": "bash C:/Users/KTDS/alarm_hook/notify.sh"
      }]
    }],
    "UserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "bash C:/Users/KTDS/alarm_hook/prompt_handler.sh"
      }]
    }]
  }
}
```

## 흐름도

### 알림 흐름 (Stop / Notification)
```
Claude 응답 완료 (Stop) 또는 알림 발생 (Notification)
        │
        ▼
   notify.sh 실행
        │
        ├─→ config.json 읽기
        │
        ├─→ flash_taskbar = false? → 종료
        │
        ├─→ Stop 이벤트 + flash_on_every_response = false? → 종료
        │
        ├─→ powershell flash_taskbar.ps1 (작업표시줄 깜빡임)
        │
        ├─→ teams_webhook_url 설정됨?
        │       └─→ curl로 Teams 웹훅 POST
        │
        ├─→ slack_webhook_url 설정됨?
        │       └─→ curl로 Slack 웹훅 POST
        │
        └─→ discord_webhook_url 설정됨?
                └─→ curl로 Discord 웹훅 POST
```

### 알림 온오프 흐름 (UserPromptSubmit)
```
사용자 입력: "알림 꺼줘"
        │
        ▼
   prompt_handler.sh 실행
        │
        ├─→ stdin에서 prompt 텍스트 추출
        │
        ├─→ "알림 꺼" 키워드 매칭?
        │       └─→ config.json의 flash_taskbar → false 로 수정
        │       └─→ stdout에 "알림이 비활성화되었습니다." 출력 (Claude에게 컨텍스트 전달)
        │
        └─→ "알림 켜" 키워드 매칭?
                └─→ config.json의 flash_taskbar → true 로 수정
                └─→ stdout에 "알림이 활성화되었습니다." 출력
```

## 환경 감지 및 크로스 플랫폼 대응

`notify.sh`에서 실행 환경을 자동 감지하여 적절한 방식으로 알림을 수행합니다.

### 지원 환경

| 환경 | 작업표시줄 깜빡임 | 메신저 알림 | 비고 |
|------|:--:|:--:|------|
| Windows (Git Bash, CMD) | O | O | 네이티브 PowerShell 직접 호출 |
| WSL | O | O | `powershell.exe`로 Windows 측 호출 |
| Docker/컨테이너 | X | O | Windows API 접근 불가, 메신저만 동작 |
| Linux 네이티브 | X | O | Windows API 없음, 메신저만 동작 |

### 환경 감지 로직 (`notify.sh` 내부)

```bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

detect_environment() {
    if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "linux"
    fi
}

flash_taskbar() {
    local env=$(detect_environment)
    case "$env" in
        wsl)
            # WSL → Windows 측 powershell.exe 호출, 경로 변환
            local win_path=$(wslpath -w "$SCRIPT_DIR/flash_taskbar.ps1")
            powershell.exe -ExecutionPolicy Bypass -File "$win_path"
            ;;
        windows)
            # 네이티브 Windows (Git Bash 등)
            powershell -ExecutionPolicy Bypass -File "$SCRIPT_DIR/flash_taskbar.ps1"
            ;;
        linux)
            # Linux/Docker → 깜빡임 불가, 건너뜀
            echo "[alarm_hook] Windows 환경이 아니므로 작업표시줄 깜빡임 건너뜀" >&2
            ;;
    esac
}
```

### 흐름도 (환경 감지 포함)

```
notify.sh 실행
    │
    ├─→ config.json 읽기
    │
    ├─→ flash_taskbar = false? → 깜빡임 건너뜀
    │
    ├─→ 환경 감지
    │       ├─→ WSL?      → powershell.exe -File (wslpath 변환)
    │       ├─→ Windows?  → powershell -File (직접 호출)
    │       └─→ Linux?    → 깜빡임 건너뜀 (로그 출력)
    │
    ├─→ teams_webhook_url 설정됨? → curl POST (모든 환경에서 동작)
    └─→ slack_webhook_url 설정됨? → curl POST (모든 환경에서 동작)
```

## 메신저 웹훅 설정 가이드

### Teams (Power Automate Workflows)

> 기존 Office 365 커넥터 방식은 지원 종료됨. 현재는 Workflows 방식을 사용해야 합니다.

1. Teams에서 알림 받을 **채널** 옆 `···` (더 보기) 클릭
2. **Workflows** 선택
3. **"Post to a channel when a webhook request is received"** 템플릿 선택
4. 워크플로우 이름 지정 → 계정 인증 → **Next**
5. Team, Channel 선택 → **Add workflow**
6. 생성된 **웹훅 URL 복사**
7. `config.json`의 `teams_webhook_url`에 붙여넣기

참고: https://support.microsoft.com/en-us/office/create-incoming-webhooks-with-workflows-for-microsoft-teams-8ae491c7-0394-4861-ba59-055e33f75498

### Slack (Incoming Webhooks App)

1. https://api.slack.com/apps 접속 → **Create New App** 클릭
2. **From scratch** 선택 → App 이름, Workspace 지정
3. 왼쪽 메뉴에서 **Incoming Webhooks** 클릭
4. **Activate Incoming Webhooks** 토글 **On**
5. 하단 **Add New Webhook to Workspace** 클릭
6. 알림 받을 **채널 선택** → **Allow**
7. 생성된 **Webhook URL 복사** (형식: `https://hooks.slack.com/services/T.../B.../xxx`)
8. `config.json`의 `slack_webhook_url`에 붙여넣기

참고: https://api.slack.com/incoming-webhooks

### Discord (Webhook)

1. Discord에서 알림 받을 **서버** 우클릭 → **서버 설정**
2. **연동** (Integrations) 클릭
3. **웹훅** (Webhooks) → **새 웹훅** (New Webhook) 클릭
4. 웹훅 이름 입력, 메시지 보낼 **채널 선택**
5. **웹후크 URL 복사** (형식: `https://discord.com/api/webhooks/...`)
6. `config.json`의 `discord_webhook_url`에 붙여넣기

참고: https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks

### 웹훅 테스트

설정 후 아래 명령어로 정상 동작 확인:

```bash
# Teams 테스트
curl -H "Content-Type: application/json" \
  -d '{"text": "테스트 알림입니다."}' \
  "YOUR_TEAMS_WEBHOOK_URL"

# Slack 테스트
curl -H "Content-Type: application/json" \
  -d '{"text": "테스트 알림입니다."}' \
  "YOUR_SLACK_WEBHOOK_URL"

# Discord 테스트
curl -H "Content-Type: application/json" \
  -d '{"content": "테스트 알림입니다."}' \
  "YOUR_DISCORD_WEBHOOK_URL"
```

> **참고**: Discord는 `"text"` 대신 `"content"` 필드를 사용합니다. `send_message.sh`에서 서비스별로 자동 변환 처리합니다.

## 주의사항
- `Stop` 이벤트는 Claude가 **매번 응답 완료 시** 발동됨
- `flash_on_every_response: false`(기본값)이면 Stop에서는 깜빡이지 않고, Notification에서만 깜빡임
- `flash_taskbar: false`면 모든 깜빡임 비활성화 (마스터 스위치)
- Teams/Slack/Discord 웹훅 URL은 사용자가 직접 `config.json`에 입력
- `UserPromptSubmit` 훅의 stdout 출력은 Claude에게 컨텍스트로 전달되어, Claude가 사용자에게 상태 변경을 안내할 수 있음
