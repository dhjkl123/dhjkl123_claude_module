#!/bin/bash
# prompt_handler.sh
# Claude Code Hook: UserPromptSubmit 이벤트 처리
# - 최초 실행 시 설정 안내
# - "알림 꺼줘/켜줘" 키워드 감지
# - 웹훅 URL 설정/삭제
# - 설정 조회

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
# Python용 Windows 경로 변환 (Git Bash/MSYS 환경 대응)
if command -v cygpath &>/dev/null; then
    CONFIG_FILE_WIN=$(cygpath -w "$CONFIG_FILE")
else
    CONFIG_FILE_WIN="$CONFIG_FILE"
fi

# stdin에서 훅 JSON 읽기
INPUT=$(cat)

# prompt 텍스트 추출
PROMPT=$(echo "$INPUT" | python -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('prompt', ''))
except:
    print('')
" 2>/dev/null)

if [[ -z "$PROMPT" ]]; then
    exit 0
fi

# config.json 존재 확인, 없으면 기본값 생성
if [[ ! -f "$CONFIG_FILE" ]]; then
    cat > "$CONFIG_FILE" << 'DEFAULTCONFIG'
{
  "initialized": false,
  "flash_taskbar": true,
  "flash_on_every_response": false,
  "teams_webhook_url": "",
  "slack_webhook_url": "",
  "discord_webhook_url": "",
  "notification_message": "Claude Code 작업이 완료되었습니다."
}
DEFAULTCONFIG
fi

# --- 유틸리티 함수 ---

read_config() {
    local key="$1"
    local default="$2"
    python -c "
import json
with open(r'$CONFIG_FILE_WIN', 'r', encoding='utf-8') as f:
    config = json.load(f)
val = config.get('$key', '$default')
print(val if val is not None else '$default')
" 2>/dev/null
}

update_config() {
    local key="$1"
    local value="$2"
    python -c "
import json
with open(r'$CONFIG_FILE_WIN', 'r', encoding='utf-8') as f:
    config = json.load(f)
config['$key'] = $value
with open(r'$CONFIG_FILE_WIN', 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=2)
    f.write('\n')
" 2>/dev/null
}

update_config_str() {
    local key="$1"
    local value="$2"
    python -c "
import json
with open(r'$CONFIG_FILE_WIN', 'r', encoding='utf-8') as f:
    config = json.load(f)
config['$key'] = '''$value'''
with open(r'$CONFIG_FILE_WIN', 'w', encoding='utf-8') as f:
    json.dump(config, f, ensure_ascii=False, indent=2)
    f.write('\n')
" 2>/dev/null
}

# --- 설정 완료 키워드 (최초 실행 감지보다 먼저 처리) ---
if echo "$PROMPT" | grep -qiE "(알림.?설정.?완료|alarm.?setup.?done|설정.?끝)"; then
    update_config "initialized" "True"
    echo "알림 설정이 완료되었습니다. 이제 알림 훅이 정상 동작합니다."
    exit 0
fi

# --- 알림 끄기 키워드 ---
if echo "$PROMPT" | grep -qiE "(알림.?꺼|알람.?꺼|알림.?off|alarm.?off|알림.?비활성|알람.?비활성)"; then
    update_config "flash_taskbar" "False"
    echo "알림이 비활성화되었습니다. 다시 켜려면 '알림 켜줘'라고 말씀해주세요."
    exit 0
fi

# --- 알림 켜기 키워드 ---
if echo "$PROMPT" | grep -qiE "(알림.?켜|알람.?켜|알림.?on|alarm.?on|알림.?활성|알람.?활성)"; then
    update_config "flash_taskbar" "True"
    echo "알림이 활성화되었습니다."
    exit 0
fi

# --- 매번 알림 켜기/끄기 ---
if echo "$PROMPT" | grep -qiE "(매번.?알림.?켜|매번.?알람.?켜|every.?response.?on)"; then
    update_config "flash_on_every_response" "True"
    echo "매 응답마다 알림이 울리도록 설정되었습니다."
    exit 0
fi

if echo "$PROMPT" | grep -qiE "(매번.?알림.?꺼|매번.?알람.?꺼|every.?response.?off)"; then
    update_config "flash_on_every_response" "False"
    echo "알림 요청 시에만 알림이 울리도록 설정되었습니다."
    exit 0
fi

# --- 웹훅 URL 설정 ---
# Teams
teams_url=$(echo "$PROMPT" | grep -oiE "(팀즈|teams).*(https?://[^ ]+)" | grep -oE "https?://[^ ]+" | head -1)
if [[ -n "$teams_url" ]]; then
    update_config_str "teams_webhook_url" "$teams_url"
    echo "Teams 웹훅 URL이 설정되었습니다: $teams_url"
    exit 0
fi

# Slack
slack_url=$(echo "$PROMPT" | grep -oiE "(슬랙|slack).*(https?://[^ ]+)" | grep -oE "https?://[^ ]+" | head -1)
if [[ -n "$slack_url" ]]; then
    update_config_str "slack_webhook_url" "$slack_url"
    echo "Slack 웹훅 URL이 설정되었습니다: $slack_url"
    exit 0
fi

# Discord
discord_url=$(echo "$PROMPT" | grep -oiE "(디스코드|discord).*(https?://[^ ]+)" | grep -oE "https?://[^ ]+" | head -1)
if [[ -n "$discord_url" ]]; then
    update_config_str "discord_webhook_url" "$discord_url"
    echo "Discord 웹훅 URL이 설정되었습니다: $discord_url"
    exit 0
fi

# --- 웹훅 삭제 ---
if echo "$PROMPT" | grep -qiE "(팀즈|teams).*(삭제|제거|초기화|지워|remove|delete|clear)"; then
    update_config_str "teams_webhook_url" ""
    echo "Teams 웹훅 URL이 삭제되었습니다."
    exit 0
fi

if echo "$PROMPT" | grep -qiE "(슬랙|slack).*(삭제|제거|초기화|지워|remove|delete|clear)"; then
    update_config_str "slack_webhook_url" ""
    echo "Slack 웹훅 URL이 삭제되었습니다."
    exit 0
fi

if echo "$PROMPT" | grep -qiE "(디스코드|discord).*(삭제|제거|초기화|지워|remove|delete|clear)"; then
    update_config_str "discord_webhook_url" ""
    echo "Discord 웹훅 URL이 삭제되었습니다."
    exit 0
fi

# --- 설정 조회 ---
if echo "$PROMPT" | grep -qiE "(알림.?설정.?보여|알림.?설정.?확인|알람.?설정.?보여|알림.?상태|alarm.?config|alarm.?status|알림.?설정)"; then
    echo "[현재 알림 설정]"
    PYTHONIOENCODING=utf-8 python -c "
import json
with open(r'$CONFIG_FILE_WIN', 'r', encoding='utf-8') as f:
    config = json.load(f)
print(f\"  작업표시줄 깜빡임: {'켜짐' if config.get('flash_taskbar') in [True, 'True', 'true'] else '꺼짐'}\")
print(f\"  매 응답마다 알림: {'켜짐' if config.get('flash_on_every_response') in [True, 'True', 'true'] else '꺼짐'}\")
teams = config.get('teams_webhook_url', '')
slack = config.get('slack_webhook_url', '')
discord = config.get('discord_webhook_url', '')
print(f\"  Teams 웹훅: {'설정됨' if teams else '미설정'}\")
print(f\"  Slack 웹훅: {'설정됨' if slack else '미설정'}\")
print(f\"  Discord 웹훅: {'설정됨' if discord else '미설정'}\")
print(f\"  알림 메시지: {config.get('notification_message', '')}\")
" 2>/dev/null
    exit 0
fi

# --- 최초 실행 감지 (키워드 매칭 후 처리) ---
initialized=$(read_config "initialized" "false")
if [[ "$initialized" == "False" || "$initialized" == "false" ]]; then
    cat << 'FIRST_RUN_MSG'
[alarm_hook 최초 실행 감지] 알림 훅이 아직 설정되지 않았습니다.
사용자에게 아래 항목을 AskUserQuestion으로 물어봐주세요:

1. 작업표시줄 깜빡임: 매 응답마다 깜빡일지(flash_on_every_response), 알림 요청 시에만 깜빡일지
2. 메신저 알림 설정 여부: Teams / Slack / Discord 중 사용할 서비스 선택
3. 선택한 서비스의 웹훅 URL 입력

사용자가 Teams를 선택하면 아래 가이드를 안내해주세요:

━━━ Teams 웹훅 설정 가이드 ━━━

[1단계: 알림 받을 채널 만들기]
  1. Teams 앱에서 원하는 팀 이름 옆 "..." 클릭
  2. "채널 추가" 선택
  3. 채널 이름 입력 (예: "Claude 알림")
  4. 프라이버시: "표준" 또는 "프라이빗" 선택 후 "추가"

[2단계: Power Automate 워크플로우 만들기]
  1. 만든 채널에서 "..." → "워크플로" 클릭
  2. "채널에 게시하는 경우 웹후크" 템플릿 중 "Post to a channel when a webhook request is received" 선택
  3. 워크플로 이름 입력 (예: "Claude 알림") → "다음"
  4. Teams 연결 확인 → "추가"
  5. 생성 완료되면 웹훅 URL이 표시됨 → 복사

[3단계: 워크플로우 편집 (메시지 내용 표시)]
  ⚠️ 이 단계를 건너뛰면 알림에 내용이 표시되지 않습니다!
  1. Power Automate (make.powerautomate.com) 접속
  2. "내 흐름" → 방금 만든 워크플로우 클릭 → "편집"
  3. "When a Teams webhook request is received" 트리거와 "Post message" 액션 사이에:
     → "+" 클릭 → "작업 추가" → "Parse JSON" 검색 → 선택
     → Content: 동적 콘텐츠에서 "Body" 선택
     → Schema에 아래 입력:
       {"type":"object","properties":{"message":{"type":"string"}}}
  4. "Post message in a chat or channel" 액션 클릭:
     → Post as: "Flow bot"
     → Post in: "Channel"
     → Team: 해당 팀 선택
     → Channel: 만든 채널 선택
     → Message: 동적 콘텐츠에서 Parse JSON의 "message" 선택
  5. "저장" 클릭

[4단계: Claude Code에 등록]
  아래처럼 말해주세요:
  "팀즈 웹훅 설정 https://복사한URL"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

사용자가 Slack을 선택하면 아래를 안내해주세요:
  1. https://api.slack.com/apps 접속 → "Create New App" → "From scratch"
  2. 앱 이름과 워크스페이스 선택 후 생성
  3. 좌측 "Incoming Webhooks" → 활성화 → "Add New Webhook to Workspace"
  4. 채널 선택 → "Allow" → 웹훅 URL 복사
  5. "슬랙 웹훅 설정 https://복사한URL" 이라고 말해주세요

사용자가 Discord를 선택하면 아래를 안내해주세요:
  1. 디스코드 서버 설정 → "연동" → "웹후크" → "새 웹후크"
  2. 이름, 채널 설정 후 "웹후크 URL 복사"
  3. "디스코드 웹훅 설정 https://복사한URL" 이라고 말해주세요

기타 설정 명령어:
- "매번 알림 켜줘" 또는 "매번 알림 꺼줘"
- 모든 설정 완료 후 "알림 설정 완료" 라고 말해주세요
FIRST_RUN_MSG
    exit 0
fi

# --- 사용자 질문을 임시 파일에 저장 (Stop 훅에서 알림 메시지로 사용) ---
LAST_PROMPT_FILE="$SCRIPT_DIR/.last_prompt"
echo "$PROMPT" > "$LAST_PROMPT_FILE"

exit 0
