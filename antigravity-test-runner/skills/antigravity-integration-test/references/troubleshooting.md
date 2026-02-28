# 트러블슈팅 가이드

## 연결 문제

### CDP 연결 실패 (포트 9222)

**증상**: `cdp-status.js`에서 "CDP 연결 실패" 오류

**원인과 해결**:
1. Antigravity IDE가 실행되지 않음
   → IDE를 `--remote-debugging-port=9222` 옵션으로 시작
2. 다른 포트로 실행 중
   → `--port` 옵션으로 올바른 포트 지정
3. 방화벽이 로컬 연결 차단
   → 127.0.0.1:9222 허용

```bash
# 포트 사용 확인 (Windows)
netstat -ano | findstr 9222

# 포트 사용 확인 (Linux/Mac)
lsof -i :9222
```

### 안티그래비티 타겟 없음

**증상**: "안티그래비티 타겟을 찾을 수 없습니다"

**원인과 해결**:
1. 채팅 패널이 열려있지 않음
   → IDE에서 채팅 패널(Antigravity 패널) 활성화
2. IDE가 다른 프로젝트에서 열림
   → 올바른 프로젝트 확인
3. 타겟 타이틀이 "Antigravity"를 포함하지 않음
   → `cdp-status.js --json`으로 실제 타겟 목록 확인

### WebSocket 연결 끊김

**증상**: 스크립트 실행 중 WebSocket 에러

**원인과 해결**:
1. IDE가 재시작됨 → 스크립트 재실행
2. 타겟 페이지가 리로드됨 → 잠시 후 재시도
3. 동시에 여러 WebSocket 연결 시도 → 한 번에 하나의 스크립트만 실행

## 텍스트 주입 문제

### 텍스트 주입 0자

**증상**: `cdp-send.js`에서 `textLen: 0`

**원인과 해결**:
1. 에디터가 포커스되지 않음
   → 스크립트가 자동으로 `click()` + `focus()` 수행. IDE 창이 최소화되지 않았는지 확인
2. Lexical 에디터가 아직 초기화되지 않음
   → 채팅 패널이 완전히 로드된 후 재시도
3. ClipboardEvent가 차단됨
   → 브라우저 보안 정책. IDE 재시작 후 재시도

**디버깅**:
```bash
# 에디터 상태 확인
node "$SCRIPTS_DIR/cdp-status.js"
# editorCount > 0 인지 확인
```

### 텍스트가 주입되었지만 Send 버튼이 비활성

**증상**: 텍스트 주입 성공, 하지만 "Send 버튼 없음"

**원인과 해결**:
1. 에이전트가 이미 실행 중 (Submit 버튼만 표시)
   → "Submit" 버튼도 검색됨, 자동 처리
2. Lexical 내부 상태가 업데이트되지 않음
   → Enter 키 폴백이 자동 적용됨
3. UI가 아직 렌더링되지 않음
   → 500ms 대기 후 자동 재시도

## 폴링 문제

### 폴링 타임아웃

**증상**: `cdp-poll.js`에서 "최대 대기 시간 초과"

**원인과 해결**:
1. 테스트가 예상보다 오래 걸림
   → `--max-polls 240` (1시간)으로 증가
2. 승인 대기 중 (비프음 발생 시)
   → IDE 창에서 "Always run" 또는 "Always Allow" 클릭
3. 에이전트가 무한 루프에 빠짐
   → IDE에서 수동으로 Cancel 클릭 후 재시도

### 비프음이 발생했는데 승인 버튼이 안 보임

**원인과 해결**:
1. 스크롤해야 보이는 위치에 있음
   → IDE 채팅 영역을 아래로 스크롤
2. 이미 자동 승인됨
   → 폴링이 다음 주기에서 정상 진행

### 결과가 불완전함

**증상**: 저장된 결과 파일에 내용이 부족함

**원인과 해결**:
1. stableCount 조건이 너무 빨리 충족
   → 폴링 간격을 늘림 (`--interval 20`)
2. CSS 아티팩트 제거로 콘텐츠가 삭제됨
   → `cdp-read.js`로 별도 읽기
3. textContent 길이 제한
   → `cdp-read.js --max-length 0` (무제한)

## 서버 문제

### http-server 포트 충돌

**증상**: "EADDRINUSE" 에러

**해결**:
```bash
# 사용 중인 포트 확인
netstat -ano | findstr 8080

# 다른 포트 사용
npx http-server . -p 8081 -c-1
```

### 페이지 로드 실패

**증상**: 안티그래비티가 페이지를 찾을 수 없음

**확인사항**:
1. http-server가 프로젝트 루트에서 실행 중인지
2. URL 경로가 올바른지 (대소문자 구분)
3. 상대 경로의 자산(CSS, JS, 이미지)이 올바른지

## ws 패키지 문제

### "Cannot find module 'ws'"

**해결**:
```bash
cd ~/.claude/plugins/antigravity-test-runner/skills/antigravity-integration-test/scripts
npm install ws
```

또는 글로벌 설치:
```bash
npm install -g ws
```

## 일반 디버깅 절차

1. **상태 점검**: `node cdp-status.js --json`
2. **타겟 확인**: 브라우저에서 `http://127.0.0.1:9222/json` 직접 접속
3. **단계별 실행**: send → poll → read 순서로 개별 실행
4. **로그 확인**: 각 스크립트의 콘솔 출력에서 단계별 진행 상태 확인
