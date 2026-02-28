# Step 5: 완료 대기 (폴링)

테스트 실행 완료를 자동으로 감지합니다.

```bash
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT
```

비프음이 활성화된 경우 `--beep` 플래그를 추가합니다:
```bash
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT --beep
```

폴링 동작:
- **15초 간격**으로 상태 점검 (변경: `--interval 15`)
- **Cancel 버튼 카운트**로 실행 상태 감지 (Cancel>0 = 실행 중)
- **Always run / Always Allow** 감지 시 콘솔에 `!! 승인필요` 출력. `--beep` 플래그가 있으면 추가로 비프음 발생
- **완료 조건**: Cancel=0 + 텍스트>1000자 + 2회 연속 동일 길이
- 완료 시 결과를 자동으로 파일에 저장

커스텀 설정:
```bash
node "$SCRIPTS_DIR/cdp-poll.js" --interval 10 --max-polls 200 --output my-result.txt --port $CDP_PORT --beep
```

**승인 대기 알림이 발생하면:**
1. Antigravity IDE 창으로 전환
2. "Always run" 또는 "Always Allow" 버튼 클릭
3. 폴링이 자동으로 재개됨

---
**다음 →** [Step 6: 결과 수집](step-6-read.md)
