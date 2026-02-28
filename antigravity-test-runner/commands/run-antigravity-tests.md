---
name: run-antigravity-tests
description: 안티그래비티 IDE를 통한 웹 프로젝트 통합테스트 실행
---

# /run-antigravity-tests

현재 웹 프로젝트의 HTML/JSP 페이지들을 Google Antigravity IDE의 Browser Subagent로 통합 테스트합니다.

## 실행 지침

`antigravity-integration-test` 스킬의 SKILL.md 워크플로우를 따라 실행하세요:

1. **프리플라이트 점검** (`cdp-status.js`)으로 CDP 연결 상태를 확인합니다.
2. 프로젝트의 HTML/JSP 파일들을 스캔하여 **테스트 계획**을 작성합니다.
3. `npx http-server . -p 8080 -c-1`로 **로컬 서버**를 시작합니다.
4. **뷰포트 설정** 프롬프트를 전송합니다 (1920x1080).
5. **테스트 프롬프트**를 작성하여 안티그래비티에 주입합니다 (`cdp-send.js`).
6. **완료를 폴링**합니다 (`cdp-poll.js`). 승인 필요 시 비프음이 발생합니다.
7. **결과를 수집**하고 보고서를 정리합니다.

스크립트 경로: `~/.claude/plugins/antigravity-test-runner/skills/antigravity-integration-test/scripts/`
