---
name: run-antigravity-tests
description: 안티그래비티 IDE를 통한 웹 프로젝트 통합테스트 실행
---

# /run-antigravity-tests

현재 웹 프로젝트의 HTML/JSP 페이지들을 Google Antigravity IDE의 Browser Subagent로 통합 테스트합니다.

## 실행 지침

`antigravity-integration-test` 스킬의 SKILL.md 워크플로우를 따라 실행하세요:

1. **프리플라이트 점검** (`cdp-status.js`)으로 CDP 연결 상태를 확인합니다.
2. 사용자가 지정한 경우 **Conversation Mode / Model 설정** (`cdp-config.js`)을 적용합니다.
3. 사용자가 제공한 **테스트 계획** (`test-plan.md`)을 확인합니다.
4. `npx http-server . -p 8080 -c-1`로 **로컬 서버**를 시작합니다.
5. 안티그래비티에 **test-plan.md를 읽고 테스트하라는 프롬프트**를 주입합니다 (`cdp-send.js`).
6. **완료를 폴링**합니다 (`cdp-poll.js`). 승인 방식에 따라 자동 승인 또는 사용자 확인 후 대리 클릭합니다.
7. **결과를 수집**합니다 (`cdp-read.js`).
8. raw 결과를 분석하여 **마크다운 보고서** (`test-report.md`)를 생성합니다.

스크립트 경로: `~/.claude/plugins/antigravity-test-runner/skills/antigravity-integration-test/scripts/`
