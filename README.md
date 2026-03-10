# dhjkl123_claude_module

Claude Code의 기능을 확장하는 **Hooks**와 **Skills** 모듈 모음 레포지토리입니다.

## 구조

```
dhjkl123_claude_module/
├── hooks/                          # Claude Code 이벤트 훅
│   └── alarm_hook/                 # 작업 완료 알림 (작업표시줄 깜빡임 + 웹훅)
├── skills/                         # Claude Code 커스텀 스킬
│   └── antigravity-test-runner/    # Antigravity IDE 통합테스트 자동화
├── register-skills.sh              # 스킬 등록 스크립트 (Linux/Mac)
├── register-skills.ps1             # 스킬 등록 스크립트 (Windows PowerShell)
└── register-skills.bat             # 스킬 등록 스크립트 (Windows 배치 래퍼)
```

## 모듈 요약

### Hooks

| 모듈 | 설명 |
|------|------|
| [alarm_hook](hooks/) | Claude Code 응답 완료 시 Windows 작업표시줄 깜빡임 + Teams/Slack/Discord 웹훅 알림 |

### Skills

| 모듈 | 설명 |
|------|------|
| [antigravity-test-runner](skills/) | Google Antigravity IDE의 Browser Subagent를 CDP로 제어하여 웹 프로젝트 통합테스트 자동 실행 |

## 설치 방법

### 스킬 등록

인터랙티브 TUI로 등록할 스킬을 선택하면 `~/.claude/skills/`에 복사됩니다.

**Windows (Git Bash / MSYS2)**
```bash
./register-skills.sh
```

**Windows (PowerShell)**
```powershell
.\register-skills.ps1
# 또는
.\register-skills.bat
```

**Linux / Mac**
```bash
./register-skills.sh
```

### 훅 등록

hooks 폴더 내의 각 훅은 Claude Code의 `~/.claude/settings.json`에 수동으로 등록합니다.
상세한 설정 방법은 [hooks/README.md](hooks/) 를 참고하세요.

## 요구사항

- [**Claude Code**](https://docs.anthropic.com/en/docs/claude-code/overview) CLI
- [**Node.js**](https://nodejs.org/) (antigravity-test-runner 스킬 사용 시)
- **Windows** (alarm_hook의 작업표시줄 깜빡임 기능)
- [**Python 3**](https://www.python.org/) (alarm_hook 설정 스크립트 내 JSON 처리)

## 라이선스

Private repository
