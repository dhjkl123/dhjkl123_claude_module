# Step 2: 로컬 서버 시작

테스트 대상 페이지를 서빙할 HTTP 서버를 **프로젝트 루트 경로**에서 시작합니다.

```bash
npx http-server "$PROJECT_ROOT" -p 8080 -c-1
```

- `$PROJECT_ROOT`: 사용자 설정의 프로젝트 루트 경로 (기본값: `.`)
- `-c-1`: 캐시 비활성화 (테스트 시 최신 파일 보장)
- 백그라운드로 실행하고 PID를 기록

서버 시작 후 `$TEST_BASE_URL`에서 페이지 접근 가능한지 확인합니다.

---
**다음 →** [Step 3: 뷰포트 설정](step-3-viewport.md)
