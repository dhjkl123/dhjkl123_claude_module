# 통합테스트 계획

## 테스트 대상

- 서버 주소: http://localhost:8080
- 서버 실행 방법: npm run dev

## 테스트 케이스

| TC | URL | 검증 항목 | 예상 결과 |
|----|-----|----------|----------|
| TC-001 | /index.html | 페이지 로드, 레이아웃 | 에러 없이 정상 렌더링 |
| TC-002 | /index.html | 메뉴 클릭 동작 | 드롭다운 표시 |
| TC-003 | /form.html | 필수 항목 미입력 후 제출 | 경고 메시지 표시 |

## 배치 분할 (선택)

TC가 많아 한 번에 실행이 어려운 경우, 배치별로 md 파일을 나눠서 작성합니다.
배치 테스트 형식은 를 참고하세요.

| TC | 테스트명 | 테스트 참고 파일 |
|----|-----|----------|
| TC-001 | 페이지 로드 | [test-plan-batch-template.md](test-plan-batch-template.md) |
| TC-002 | 메뉴 클릭 동작 | [test-plan-batch-template.md](test-plan-batch-template.md) |
| TC-003 | 필수 항목 미입력 후 제출 | [test-plan-batch-template.md](test-plan-batch-template.md) |

## 리포트 작성

테스트 완료 후 `antigravity-integration-test/test-report.md`에 결과를 작성합니다.
형식은 [test-report-template.md](test-report-template.md)를 따릅니다.

