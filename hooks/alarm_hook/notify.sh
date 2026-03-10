#!/bin/bash
# notify.sh
# Claude Code Hook: Stop / Notification 이벤트 처리
# 작업표시줄 깜빡임 + 메신저 알림 전송

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
if command -v cygpath &>/dev/null; then
    CONFIG_FILE_WIN=$(cygpath -w "$CONFIG_FILE")
else
    CONFIG_FILE_WIN="$CONFIG_FILE"
fi

# stdin에서 훅 JSON 읽기
INPUT=$(cat)

# config.json 읽기
if [[ ! -f "$CONFIG_FILE" ]]; then
    exit 0
fi

# python으로 JSON 파싱 (jq 없는 환경 대응)
read_config() {
    local key="$1"
    local default="$2"
    echo "$CONFIG_FILE" | xargs cat | python -c "
import sys, json
try:
    data = json.load(sys.stdin)
    val = data.get('$key', '$default')
    print(val if val is not None else '$default')
except:
    print('$default')
" 2>/dev/null
}

# 설정 값 읽기
flash_taskbar=$(read_config "flash_taskbar" "true")
flash_on_every_response=$(read_config "flash_on_every_response" "false")

# 이벤트 정보 추출 (한 번에 파싱)
eval "$(echo "$INPUT" | python -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('hook_event=' + repr(data.get('hook_event_name', '')))
    print('hook_cwd=' + repr(data.get('cwd', '')))
    print('notification_type=' + repr(data.get('notification_type', '')))
except:
    print('hook_event=\"\"')
    print('hook_cwd=\"\"')
    print('notification_type=\"\"')
" 2>/dev/null)"

# 마스터 스위치 체크
if [[ "$flash_taskbar" != "true" && "$flash_taskbar" != "True" ]]; then
    exit 0
fi

# Notification 이벤트 처리
if [[ "$hook_event" == "Notification" ]]; then
    # idle_prompt는 Stop과 중복되므로 무시
    if [[ "$notification_type" == "idle_prompt" ]]; then
        exit 0
    fi

    # notification_type별 메시지 설정
    case "$notification_type" in
        permission_prompt)
            NOTIFY_MESSAGE="권한 승인이 필요합니다"
            ;;
        elicitation_dialog)
            NOTIFY_MESSAGE="질문에 답변해주세요"
            ;;
        auth_success)
            NOTIFY_MESSAGE="인증이 완료되었습니다"
            ;;
        *)
            NOTIFY_MESSAGE="알림이 도착했습니다"
            ;;
    esac
fi

# Stop 이벤트일 때 flash_on_every_response 체크
if [[ "$hook_event" == "Stop" && "$flash_on_every_response" != "true" && "$flash_on_every_response" != "True" ]]; then
    exit 0
fi

# --- 환경 감지 ---
detect_environment() {
    if grep -qi microsoft /proc/version 2>/dev/null; then
        echo "wsl"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "linux"
    fi
}

# --- 작업표시줄 깜빡임 ---
env_type=$(detect_environment)
case "$env_type" in
    wsl)
        win_path=$(wslpath -w "$SCRIPT_DIR/flash_taskbar.ps1")
        powershell.exe -ExecutionPolicy Bypass -File "$win_path" 2>/dev/null &
        ;;
    windows)
        powershell -ExecutionPolicy Bypass -File "$SCRIPT_DIR/flash_taskbar.ps1" 2>/dev/null &
        ;;
    linux)
        # Linux/Docker → 깜빡임 불가
        ;;
esac

# --- 메시지 결정 ---
if [[ "$hook_event" == "Notification" ]]; then
    # Notification 이벤트: 상황별 메시지 사용
    FINAL_MESSAGE="$NOTIFY_MESSAGE"
else
    # Stop 이벤트: 사용자 질문 기반 메시지
    LAST_PROMPT_FILE="$SCRIPT_DIR/.last_prompt"
    FINAL_MESSAGE=""
    if [[ -f "$LAST_PROMPT_FILE" ]]; then
        LAST_PROMPT=$(cat "$LAST_PROMPT_FILE")
        if [[ -n "$LAST_PROMPT" ]]; then
            FINAL_MESSAGE="$LAST_PROMPT"
        fi
    fi
fi

# --- 메신저 알림 전송 ---
if [[ -n "$FINAL_MESSAGE" ]]; then
    bash "$SCRIPT_DIR/send_message.sh" "$FINAL_MESSAGE" "$hook_cwd" "$hook_event" &
else
    bash "$SCRIPT_DIR/send_message.sh" "" "$hook_cwd" "$hook_event" &
fi

# 백그라운드 프로세스 완료 대기
wait

exit 0
