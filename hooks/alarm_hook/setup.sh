#!/bin/bash
# setup.sh
# 알림 훅 대화형 초기 설정 스크립트
# 사용법: bash setup.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
if command -v cygpath &>/dev/null; then
    CONFIG_FILE_WIN=$(cygpath -w "$CONFIG_FILE")
else
    CONFIG_FILE_WIN="$CONFIG_FILE"
fi

# config.json 없으면 기본값 생성
if [[ ! -f "$CONFIG_FILE" ]]; then
    cat > "$CONFIG_FILE" << 'EOF'
{
  "initialized": false,
  "flash_taskbar": true,
  "flash_on_every_response": false,
  "teams_webhook_url": "",
  "slack_webhook_url": "",
  "discord_webhook_url": "",
  "notification_message": "Claude Code 작업이 완료되었습니다."
}
EOF
fi

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
"
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
"
}

echo "========================================="
echo "  Claude Code 알림 훅 설정"
echo "========================================="
echo ""

# 1. 작업표시줄 깜빡임
echo "[1/5] 작업표시줄 깜빡임을 사용하시겠습니까?"
echo "  1) 켜기 (기본값)"
echo "  2) 끄기"
read -rp "선택 [1]: " choice
case "$choice" in
    2) update_config "flash_taskbar" "False"; echo "  → 깜빡임 꺼짐" ;;
    *) update_config "flash_taskbar" "True"; echo "  → 깜빡임 켜짐" ;;
esac
echo ""

# 2. 매 응답마다 깜빡임
echo "[2/5] 매 응답마다 깜빡이게 할까요?"
echo "  1) 아니오, 알림 요청 시에만 (기본값)"
echo "  2) 예, 매 응답마다"
read -rp "선택 [1]: " choice
case "$choice" in
    2) update_config "flash_on_every_response" "True"; echo "  → 매 응답마다 깜빡임" ;;
    *) update_config "flash_on_every_response" "False"; echo "  → 알림 요청 시에만 깜빡임" ;;
esac
echo ""

# 3. Teams 웹훅
echo "[3/5] Teams 웹훅 URL (없으면 Enter로 건너뛰기)"
echo "  발급 방법: 채널 ··· → Workflows → 'Post to a channel when a webhook request is received'"
read -rp "URL: " teams_url
if [[ -n "$teams_url" ]]; then
    update_config_str "teams_webhook_url" "$teams_url"
    echo "  → Teams 웹훅 설정 완료"
else
    echo "  → 건너뜀"
fi
echo ""

# 4. Slack 웹훅
echo "[4/5] Slack 웹훅 URL (없으면 Enter로 건너뛰기)"
echo "  발급 방법: api.slack.com/apps → Create App → Incoming Webhooks → Add to Workspace"
read -rp "URL: " slack_url
if [[ -n "$slack_url" ]]; then
    update_config_str "slack_webhook_url" "$slack_url"
    echo "  → Slack 웹훅 설정 완료"
else
    echo "  → 건너뜀"
fi
echo ""

# 5. Discord 웹훅
echo "[5/5] Discord 웹훅 URL (없으면 Enter로 건너뛰기)"
echo "  발급 방법: 서버 설정 → 연동 → 웹훅 → 새 웹훅 → URL 복사"
read -rp "URL: " discord_url
if [[ -n "$discord_url" ]]; then
    update_config_str "discord_webhook_url" "$discord_url"
    echo "  → Discord 웹훅 설정 완료"
else
    echo "  → 건너뜀"
fi
echo ""

# 초기화 완료 표시
update_config "initialized" "True"

echo "========================================="
echo "  설정 완료!"
echo "========================================="
echo ""
echo "현재 설정:"
python -c "
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
"
echo ""
echo "나중에 변경하려면:"
echo "  - Claude에게: '알림 설정 보여줘', '팀즈 웹훅 설정 https://...'"
echo "  - 터미널에서: bash $SCRIPT_DIR/setup.sh"
echo "  - 직접 편집: $CONFIG_FILE"
