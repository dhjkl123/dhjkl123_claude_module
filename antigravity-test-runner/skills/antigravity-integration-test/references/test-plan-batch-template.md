# 배치 통합테스트 계획

TC가 많아 한 번에 실행이 어려운 경우, 배치별로 md 파일을 나눠서 작성합니다.
각 배치 파일은 독립적으로 안티그래비티에 전달됩니다.

## 파일 구조

```
$PROJECT_ROOT/
└── antigravity-integration-test/
    ├── test-plan-batch-1.md    # 핵심 페이지
    ├── test-plan-batch-2.md    # 목록/상세 페이지
    ├── test-plan-batch-3.md    # 폼/입력 페이지
    └── viewport-prompt.md
```

## 배치 파일 형식

각 배치 md 파일은 아래 형식을 따릅니다:

```markdown
# Batch 1: 핵심 페이지

| TC | URL | 검증 항목 | 예상 결과 |
|----|-----|----------|----------|
| TC-001 | /index.html | 페이지 로드, 레이아웃 | 에러 없이 정상 렌더링 |
| TC-002 | /index.html | 메뉴 클릭 동작 | 드롭다운 표시 |
| TC-003 | /dashboard.html | 대시보드 위젯 렌더링 | 차트, 테이블 정상 표시 |

## 리포트 형식

TC-001: PASS/FAIL - [상세 사유]
TC-002: PASS/FAIL - [상세 사유]
TC-003: PASS/FAIL - [상세 사유]
```

## 실행 흐름

배치 1 주입 → 폴링 → 결과 수집 → 배치 2 주입 → ... → 전체 결과 병합 → 보고서
