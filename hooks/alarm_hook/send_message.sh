#!/bin/bash
# send_message.sh
# Teams/Slack/Discord 웹훅으로 메시지 전송
# 사용법: bash send_message.sh "메시지 내용"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
if command -v cygpath &>/dev/null; then
    CONFIG_FILE_WIN=$(cygpath -w "$CONFIG_FILE")
else
    CONFIG_FILE_WIN="$CONFIG_FILE"
fi
MESSAGE="${1:-}"
CWD="${2:-}"
EVENT_TYPE="${3:-Stop}"

# config.json 읽기
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "[alarm_hook] config.json을 찾을 수 없습니다: $CONFIG_FILE" >&2
    exit 1
fi

# 메시지가 없으면 config의 기본 메시지 사용
if [[ -z "$MESSAGE" ]]; then
    MESSAGE=$(cat "$CONFIG_FILE" | python -c "import sys,json; print(json.load(sys.stdin).get('notification_message','Claude Code 작업이 완료되었습니다.'))" 2>/dev/null)
    if [[ -z "$MESSAGE" ]]; then
        MESSAGE="Claude Code 작업이 완료되었습니다."
    fi
fi

# UTF-8 JSON 페이로드 생성 (Windows cp949 인코딩 문제 방지)
# 환경변수로 전달하여 경로 백슬래시/특수문자 이스케이프 문제 방지
format_message() {
    PYTHONIOENCODING=utf-8 HOOK_MSG="$1" HOOK_CWD="$2" python -c "
import datetime, os
now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
cwd = os.environ.get('HOOK_CWD', '')
msg = os.environ.get('HOOK_MSG', '')
lines = ['[Claude Code] \"' + msg + '\" 작업이 완료되었습니다.']
if cwd:
    lines.append(chr(0x1F4C2) + ' ' + cwd)
lines.append(chr(0x1F550) + ' ' + now)
print(chr(10).join(lines))
"
}

make_payload() {
    local key="$1"
    local formatted
    formatted=$(PYTHONIOENCODING=utf-8 HOOK_MSG="$2" HOOK_CWD="$3" HOOK_EVENT="$EVENT_TYPE" python -c "
import datetime, os
now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
cwd = os.environ.get('HOOK_CWD', '')
msg = os.environ.get('HOOK_MSG', '')
event = os.environ.get('HOOK_EVENT', 'Stop')
if event == 'Notification':
    lines = ['[Claude Code] ' + chr(0x26A0) + ' ' + msg]
else:
    lines = ['[Claude Code] \"' + msg + '\" ' + chr(0xC791) + chr(0xC5C5) + chr(0xC774) + ' ' + chr(0xC644) + chr(0xB8CC) + chr(0xB418) + chr(0xC5C8) + chr(0xC2B5) + chr(0xB2C8) + chr(0xB2E4) + '.']
if cwd:
    lines.append(chr(0x1F4C2) + ' ' + cwd)
lines.append(chr(0x1F550) + ' ' + now)
print(chr(10).join(lines))
")
    PYTHONIOENCODING=utf-8 HOOK_FORMATTED="$formatted" HOOK_KEY="$key" python -c "
import json, os
print(json.dumps({os.environ['HOOK_KEY']: os.environ['HOOK_FORMATTED']}, ensure_ascii=False))
"
}

# Teams용 페이로드 생성 (Post message 워크플로우용, <br>로 줄바꿈)
make_teams_payload() {
    PYTHONIOENCODING=utf-8 HOOK_MSG="$1" HOOK_CWD="$2" HOOK_EVENT="$EVENT_TYPE" python -c "
import datetime, os, json
now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
cwd = os.environ.get('HOOK_CWD', '')
msg = os.environ.get('HOOK_MSG', '')
event = os.environ.get('HOOK_EVENT', 'Stop')
if event == 'Notification':
    lines = ['[Claude Code] \u26a0 ' + msg]
else:
    lines = ['[Claude Code] \"' + msg + '\" \uc791\uc5c5\uc774 \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4.']
if cwd:
    lines.append(chr(0x1F4C2) + ' ' + cwd)
lines.append(chr(0x1F550) + ' ' + now)
print(json.dumps({'message': '<br>'.join(lines)}, ensure_ascii=False))
"
}

# Teams 웹훅 전송
teams_url=$(cat "$CONFIG_FILE" | python -c "import sys,json; print(json.load(sys.stdin).get('teams_webhook_url',''))" 2>/dev/null)
if [[ -n "$teams_url" ]]; then
    make_teams_payload "$MESSAGE" "$CWD" | curl -s -o /dev/null \
        -H "Content-Type: application/json; charset=utf-8" \
        --data-binary @- \
        "$teams_url" &
fi

# Slack 웹훅 전송
slack_url=$(cat "$CONFIG_FILE" | python -c "import sys,json; print(json.load(sys.stdin).get('slack_webhook_url',''))" 2>/dev/null)
if [[ -n "$slack_url" ]]; then
    make_payload "text" "$MESSAGE" "$CWD" | curl -s -o /dev/null \
        -H "Content-Type: application/json; charset=utf-8" \
        --data-binary @- \
        "$slack_url" &
fi

# Discord 웹훅 전송 (Discord는 "content" 필드 사용)
discord_url=$(cat "$CONFIG_FILE" | python -c "import sys,json; print(json.load(sys.stdin).get('discord_webhook_url',''))" 2>/dev/null)
if [[ -n "$discord_url" ]]; then
    make_payload "content" "$MESSAGE" "$CWD" | curl -s -o /dev/null \
        -H "Content-Type: application/json; charset=utf-8" \
        --data-binary @- \
        "$discord_url" &
fi

# 백그라운드 curl 완료 대기
wait
