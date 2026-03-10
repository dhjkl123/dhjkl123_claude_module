# Hooks

Claude Code의 이벤트 훅 모듈 모음입니다.

## 등록 방법

`~/.claude/settings.json`의 `hooks` 항목에 각 훅 스크립트를 등록합니다.
등록 방법 및 지원 이벤트에 대한 자세한 내용은 [Claude Code 공식 문서 - Hooks](https://docs.anthropic.com/en/docs/claude-code/hooks)를 참고하세요.

---


<summary><h2>alarm_hook</h2>Claude Code 작업 완료 시 Windows 작업표시줄 깜빡임 + Teams/Slack/Discord 웹훅 알림</summary>
<details>

### 파일 구조

```
alarm_hook/
├── config.json           # 알림 설정 (on/off, 웹훅 URL 등)
├── setup.sh              # 초기 설정 인터랙티브 스크립트
├── prompt_handler.sh     # UserPromptSubmit 이벤트 핸들러 (키워드 감지)
├── notify.sh             # Stop/Notification 이벤트 핸들러 (알림 발송)
├── send_message.sh       # 웹훅 메시지 포맷팅 및 전송
├── flash_taskbar.ps1     # Windows 작업표시줄 깜빡임 (FlashWindowEx API)
├── PLAN.md               # 구현 계획 및 상세 문서
└── .last_prompt          # 마지막 사용자 입력 임시 저장
```

### 사용하는 이벤트

| 이벤트 | 핸들러 | 설명 |
|--------|--------|------|
| `Stop` | `notify.sh` | Claude 응답 완료 시 알림 발송 |
| `Notification` | `notify.sh` | 권한 요청 등 알림 발생 시 알림 발송 |
| `UserPromptSubmit` | `prompt_handler.sh` | 사용자 입력에서 알림 설정 키워드 감지 |

### 설정 항목 (config.json)

| 키 | 타입 | 설명 |
|----|------|------|
| `initialized` | boolean | 초기 설정 완료 여부 |
| `flash_taskbar` | boolean | 작업표시줄 깜빡임 마스터 스위치 |
| `flash_on_every_response` | boolean | 모든 응답마다 깜빡임 (false면 Notification 이벤트만) |
| `teams_webhook_url` | string | Microsoft Teams 웹훅 URL |
| `slack_webhook_url` | string | Slack 웹훅 URL |
| `discord_webhook_url` | string | Discord 웹훅 URL |
| `notification_message` | string | 기본 알림 메시지 템플릿 |

### 실행 Flow

#### 1. 알림 설정 Flow (사용자 키워드 → 설정 변경)

```
사용자 메시지 입력
    │
    ▼
prompt_handler.sh (UserPromptSubmit 이벤트)
    │
    ├─ "알림 켜" / "alarm on"    → config.json의 flash_taskbar = true
    ├─ "알림 꺼" / "alarm off"   → config.json의 flash_taskbar = false
    ├─ "매번 알림 켜"             → flash_on_every_response = true
    ├─ "매번 알림 꺼"             → flash_on_every_response = false
    ├─ "팀즈 웹훅 설정 [URL]"    → teams_webhook_url 업데이트
    ├─ "슬랙 웹훅 설정 [URL]"    → slack_webhook_url 업데이트
    ├─ "디스코드 웹훅 설정 [URL]" → discord_webhook_url 업데이트
    ├─ "알림 설정 보여"           → 현재 설정값 stdout 출력
    └─ .last_prompt에 입력 저장
```

#### 2. 알림 발송 Flow (작업 완료 → 알림)

```
Claude Code 응답 완료 (Stop) 또는 알림 발생 (Notification)
    │
    ▼
notify.sh
    │
    ├─ config.json 읽기
    ├─ flash_taskbar == false → 종료
    ├─ Stop 이벤트 + flash_on_every_response == false → 종료
    │
    ├─ 환경 감지
    │   ├─ WSL     → powershell.exe + wslpath 변환
    │   ├─ Git Bash → powershell 직접 호출
    │   └─ Linux   → 작업표시줄 깜빡임 건너뜀
    │
    ├─ flash_taskbar.ps1 실행 (작업표시줄 5회 깜빡임)
    │
    └─ send_message.sh 호출
        ├─ Teams 웹훅 URL 있으면 → POST (JSON, <br> 줄바꿈)
        ├─ Slack 웹훅 URL 있으면 → POST (JSON, \n 줄바꿈)
        └─ Discord 웹훅 URL 있으면 → POST (JSON, \n 줄바꿈)
        (모든 요청은 백그라운드 비동기 전송)
```

### 지원 플랫폼

| 플랫폼 | 작업표시줄 깜빡임 | 웹훅 알림 |
|--------|:---:|:---:|
| Windows (Git Bash / MSYS2) | O | O |
| WSL | O | O |
| Linux (Native) | X | O |

### 키워드 목록

한국어와 영어 키워드를 모두 지원합니다.

- **알림 켜기**: `알림 켜`, `알람 켜`, `alarm on`
- **알림 끄기**: `알림 꺼`, `알람 꺼`, `alarm off`
- **매번 알림**: `매번 알림 켜/꺼`
- **웹훅 설정**: `팀즈/슬랙/디스코드 웹훅 설정 [URL]`
- **웹훅 삭제**: `팀즈/슬랙/디스코드 웹훅 삭제`
- **설정 확인**: `알림 설정 보여`

</details>
