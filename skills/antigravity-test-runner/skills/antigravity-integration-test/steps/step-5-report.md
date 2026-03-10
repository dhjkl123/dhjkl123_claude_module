# Step 5: 보고서 확인

Antigravity가 테스트 완료 후 `test-plan-template.md`의 리포트 작성 지시에 따라 `test-report.md`를 자동으로 생성합니다. Claude는 해당 파일을 확인하고 사용자에게 안내합니다.

## 진행 순서

### 1. 보고서 파일 확인

`$PROJECT_ROOT/antigravity-integration-test/test-report.md` 파일이 존재하는지 확인합니다.

- 파일이 존재하면 → 내용을 읽고 사용자에게 요약을 안내합니다.
- 파일이 없으면 → `test-result.txt`를 기반으로 사용자에게 결과를 안내합니다. (Antigravity가 리포트를 생성하지 않은 경우)

### 2. 결과 안내

사용자에게 테스트 결과 요약과 파일 경로를 안내합니다.

**최종 결과 파일 구조:**
```
$PROJECT_ROOT/
└── antigravity-integration-test/
    ├── test-plan.md
    ├── test-result.txt
    └── test-report.md
```

---
**완료.** 모든 단계가 끝났습니다.
