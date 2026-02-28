#!/usr/bin/env bash
# register-skills.sh
# dhjkl123_skills 레포의 스킬을 ~/.claude/skills/ 및 ~/.claude/commands/ 에 등록하는 스크립트

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_HOME="${HOME}/.claude"
SKILLS_TARGET="${CLAUDE_HOME}/skills"
COMMANDS_TARGET="${CLAUDE_HOME}/commands"

# 색상/스타일 정의
RESET=$'\033[0m'
BOLD=$'\033[1m'
DIM=$'\033[2m'
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
CYAN=$'\033[0;36m'
WHITE=$'\033[1;37m'
BG_CYAN=$'\033[46m'
HIDE_CURSOR=$'\033[?25l'
SHOW_CURSOR=$'\033[?25h'
CLR=$'\033[K'

# 종료 시 커서 복원
cleanup() {
    printf '%s' "${SHOW_CURSOR}"
    stty echo 2>/dev/null || true
}
trap cleanup EXIT

# 1. 스킬 탐지
declare -a SKILL_DIRS=()
declare -a SKILL_NAMES=()
declare -a SKILL_DESCS=()

for dir in "${SCRIPT_DIR}"/*/; do
    plugin_json="${dir}.claude-plugin/plugin.json"
    if [[ -f "${plugin_json}" ]]; then
        SKILL_DIRS+=("${dir}")
        name=$(grep -o '"name"[[:space:]]*:[[:space:]]*"[^"]*"' "${plugin_json}" | head -1 | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')
        desc=$(grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' "${plugin_json}" | head -1 | sed 's/.*"description"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/')
        SKILL_NAMES+=("${name}")
        SKILL_DESCS+=("${desc}")
    fi
done

TOTAL=${#SKILL_DIRS[@]}

if [[ ${TOTAL} -eq 0 ]]; then
    echo -e "${RED}발견된 스킬이 없습니다.${RESET}"
    echo "각 스킬 폴더에 .claude-plugin/plugin.json 파일이 있어야 합니다."
    exit 1
fi

# 2. 인터랙티브 선택 UI
declare -a SELECTED=()
for ((i=0; i<TOTAL; i++)); do
    SELECTED+=(0)
done
CURSOR=0

draw_menu() {
    # 화면 클리어 후 처음부터 다시 그리기
    printf '\033[2J\033[H'

    echo "${CYAN}${BOLD}=== dhjkl123_skills 스킬 등록 스크립트 ===${RESET}"
    echo ""
    echo "${YELLOW}${BOLD}  ↑↓ 이동  |  Space 선택  |  A 전체  |  Enter 확인${RESET}"
    echo ""
    for ((i=0; i<TOTAL; i++)); do
        local check=" "
        if [[ ${SELECTED[$i]} -eq 1 ]]; then
            check="*"
        fi

        local name="${SKILL_NAMES[$i]}"
        local desc="${SKILL_DESCS[$i]}"

        if [[ $i -eq $CURSOR ]]; then
            echo "${BG_CYAN}${WHITE}${BOLD}  [${check}] ${name} - ${desc} ${RESET}"
        elif [[ ${SELECTED[$i]} -eq 1 ]]; then
            echo "  [${GREEN}${BOLD}${check}${RESET}] ${name} - ${desc}"
        else
            echo "  ${DIM}[ ] ${name} - ${desc}${RESET}"
        fi
    done
    echo ""
}

printf '%s' "${HIDE_CURSOR}"
draw_menu

while true; do
    IFS= read -rsn1 key || true

    if [[ "${key}" == $'\x1b' ]]; then
        IFS= read -rsn1 -t 0.5 k2 || true
        IFS= read -rsn1 -t 0.5 k3 || true
        if [[ "${k3}" == 'A' && $CURSOR -gt 0 ]]; then
            CURSOR=$((CURSOR - 1))
        elif [[ "${k3}" == 'B' && $CURSOR -lt $((TOTAL - 1)) ]]; then
            CURSOR=$((CURSOR + 1))
        fi
    elif [[ "${key}" == ' ' ]]; then
        if [[ ${SELECTED[$CURSOR]} -eq 0 ]]; then
            SELECTED[$CURSOR]=1
        else
            SELECTED[$CURSOR]=0
        fi
    elif [[ "${key}" == 'a' || "${key}" == 'A' ]]; then
        all_selected=1
        for ((i=0; i<TOTAL; i++)); do
            if [[ ${SELECTED[$i]} -eq 0 ]]; then
                all_selected=0
                break
            fi
        done
        if [[ $all_selected -eq 1 ]]; then
            for ((i=0; i<TOTAL; i++)); do SELECTED[$i]=0; done
        else
            for ((i=0; i<TOTAL; i++)); do SELECTED[$i]=1; done
        fi
    elif [[ "${key}" == '' ]]; then
        break
    fi

    draw_menu
done

printf '%s' "${SHOW_CURSOR}"

# 선택된 인덱스 수집
declare -a SELECTED_INDICES=()
for ((i=0; i<TOTAL; i++)); do
    if [[ ${SELECTED[$i]} -eq 1 ]]; then
        SELECTED_INDICES+=("$i")
    fi
done

if [[ ${#SELECTED_INDICES[@]} -eq 0 ]]; then
    echo -e "${RED}선택된 스킬이 없습니다.${RESET}"
    exit 0
fi

echo -e "${BOLD}선택됨: ${#SELECTED_INDICES[@]}개${RESET}"
echo ""

# 3. 등록 실행
mkdir -p "${SKILLS_TARGET}"
mkdir -p "${COMMANDS_TARGET}"

for idx in "${SELECTED_INDICES[@]}"; do
    skill_dir="${SKILL_DIRS[$idx]}"
    skill_name="${SKILL_NAMES[$idx]}"

    echo -e "${CYAN}등록 중: ${skill_name}${RESET}"

    # skills/ 복사
    if [[ -d "${skill_dir}skills" ]]; then
        src="${skill_dir}skills"
        for item in "${src}"/*/; do
            if [[ -d "${item}" ]]; then
                base=$(basename "${item}")
                dest="${SKILLS_TARGET}/${base}"
                if [[ -d "${dest}" ]]; then
                    read -rp "  ${base} 이미 존재합니다. 덮어쓰시겠습니까? (y/N): " overwrite
                    if [[ ! "${overwrite}" =~ ^[yY]$ ]]; then
                        echo -e "  ${YELLOW}건너뜀: ${base}${RESET}"
                        continue
                    fi
                fi
                cp -r "${item}" "${SKILLS_TARGET}/"
                echo -e "  ${GREEN}skills/${base} → ~/.claude/skills/${base}${RESET}"
            fi
        done
        for item in "${src}"/*; do
            if [[ -f "${item}" ]]; then
                base=$(basename "${item}")
                dest="${SKILLS_TARGET}/${base}"
                if [[ -f "${dest}" ]]; then
                    read -rp "  ${base} 이미 존재합니다. 덮어쓰시겠습니까? (y/N): " overwrite
                    if [[ ! "${overwrite}" =~ ^[yY]$ ]]; then
                        echo -e "  ${YELLOW}건너뜀: ${base}${RESET}"
                        continue
                    fi
                fi
                cp "${item}" "${SKILLS_TARGET}/"
                echo -e "  ${GREEN}skills/${base} → ~/.claude/skills/${base}${RESET}"
            fi
        done
    fi

    # commands/ 복사
    if [[ -d "${skill_dir}commands" ]]; then
        src="${skill_dir}commands"
        for item in "${src}"/*; do
            if [[ -e "${item}" ]]; then
                base=$(basename "${item}")
                dest="${COMMANDS_TARGET}/${base}"
                if [[ -e "${dest}" ]]; then
                    read -rp "  ${base} 이미 존재합니다. 덮어쓰시겠습니까? (y/N): " overwrite
                    if [[ ! "${overwrite}" =~ ^[yY]$ ]]; then
                        echo -e "  ${YELLOW}건너뜀: ${base}${RESET}"
                        continue
                    fi
                fi
                if [[ -d "${item}" ]]; then
                    cp -r "${item}" "${COMMANDS_TARGET}/"
                else
                    cp "${item}" "${COMMANDS_TARGET}/"
                fi
                echo -e "  ${GREEN}commands/${base} → ~/.claude/commands/${base}${RESET}"
            fi
        done
    fi
done

# 4. 결과 출력
echo ""
echo -e "${GREEN}${BOLD}=== 등록 완료 ===${RESET}"
echo -e "  skills  → ${SKILLS_TARGET}"
echo -e "  commands → ${COMMANDS_TARGET}"
