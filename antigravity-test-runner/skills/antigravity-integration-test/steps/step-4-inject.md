# Step 4: 테스트 프롬프트 주입

테스트 계획 파일의 **내용을 직접 전송하지 않습니다.** 대신 안티그래비티에게 해당 파일을 읽고 테스트를 수행하라는 짧은 프롬프트를 주입합니다.

```bash
node "$SCRIPTS_DIR/cdp-send.js" --text "Read the test plan at antigravity-integration-test/test-plan.md and execute all test cases described in it. Take screenshots at ${VIEWPORT} resolution. Report results for each TC as: TC-XXX: PASS/FAIL - [details]" --port $CDP_PORT
```

**왜 파일 경로를 전달하는가:**
- 안티그래비티 IDE가 프로젝트 폴더를 열고 있으므로 프로젝트 내 파일에 직접 접근 가능
- 긴 테스트 계획도 paste 길이 제한 없이 전달 가능
- 안티그래비티가 파일을 직접 읽고 해석하므로 마크다운 서식이 보존됨

**프롬프트 커스텀:**
- 사용자가 추가 지시사항을 요청한 경우 프롬프트에 포함합니다.
- 예: `"... Also focus on form validation and check for console errors."`

**주의사항:**
- 프롬프트가 매우 긴 경우 (10,000자+) ClipboardEvent paste가 느릴 수 있으므로 대기 시간 증가
- 프롬프트에 백틱, 큰따옴표 등 특수문자가 포함되어도 JSON.stringify로 안전하게 이스케이프됨

---
**다음 →** [Step 5: 완료 대기](step-5-poll.md)
