# Step 5: 완료 대기 (폴링)

테스트 실행 완료를 자동으로 감지합니다.

폴링 명령은 **승인 처리 방식** 설정에 따라 플래그가 달라집니다:

| 승인 처리 방식 | 폴링 플래그 |
|---------------|------------|
| `auto` | `--auto-approve` |
| `ask` | `--exit-on-approve` |
| `manual` | (플래그 없음) |

비프음 설정이 `enable`이면 `--beep` 플래그를 추가합니다.

**예시:**
```bash
# auto: 승인 자동 클릭
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT --auto-approve --beep

# ask: 승인 감지 시 종료코드 3으로 중단 → 사용자에게 질문
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT --exit-on-approve

# manual: 사용자가 IDE에서 직접 처리
node "$SCRIPTS_DIR/cdp-poll.js" --output test-result.txt --port $CDP_PORT
```

**폴링 동작:**
- **15초 간격**으로 상태 점검 (변경: `--interval 15`)
- **Cancel 버튼 카운트**로 실행 상태 감지 (Cancel>0 = 실행 중)
- **Always run / Always Allow** 감지 시 → 승인 처리 방식에 따라 동작
- **완료 조건**: Cancel=0 + 텍스트>1000자 + 2회 연속 동일 길이
- 완료 시 결과를 자동으로 파일에 저장

## 승인 대기 처리 (승인 처리 방식별)

### `auto` 모드
`--auto-approve` 플래그로 폴링하면 승인 버튼을 자동으로 클릭합니다. 별도 처리 불필요.

### `ask` 모드 (종료코드 3)
폴링이 종료코드 3으로 종료되면, **AskUserQuestion 도구로 사용자에게 승인 여부를 확인합니다:**

- 질문: "안티그래비티 IDE에서 승인(Always run/Always Allow)을 요청하고 있습니다. 자동으로 승인할까요?"
- 선택지: `승인` (자동 클릭 실행) / `건너뛰기` (사용자가 직접 IDE에서 처리)

**사용자가 "승인"을 선택한 경우:**
```bash
node "$SCRIPTS_DIR/cdp-approve.js" --port $CDP_PORT
```

**사용자가 "건너뛰기"를 선택한 경우:**
- 사용자에게 IDE 창에서 직접 버튼을 클릭하라고 안내

어느 쪽이든 승인 후 폴링을 재시작합니다. **승인 → 폴링 → 또 승인** 사이클이 반복될 수 있으며, 테스트가 완료(종료코드 0)될 때까지 반복합니다.

### `manual` 모드
폴링 로그에 `!! 승인필요`가 출력되면, 사용자가 직접 IDE 창에서 버튼을 클릭합니다. 폴링은 중단 없이 계속됩니다.

**타임아웃 발생 시:**
- 기본 max-polls(120) × interval(15초) = 약 30분
- 승인 대기 상태에서 응답이 없으면 타임아웃될 수 있으므로 `--max-polls` 증가를 고려

---
**다음 →** [Step 4: 결과 수집](step-4-read.md)
