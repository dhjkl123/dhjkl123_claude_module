# Step 1: 테스트 계획 준비

프로젝트 루트에 `antigravity-integration-test/` 폴더를 생성하고, 테스트 계획을 md 파일로 정리하여 저장합니다. **스킬이 자체적으로 프로젝트를 분석하거나 테스트 계획을 생성하지 않습니다.**

```
$PROJECT_ROOT/
└── antigravity-integration-test/
    └── test-plan.md          # 테스트 계획 (사용자 제공)
```

**진행 순서:**
1. `$PROJECT_ROOT/antigravity-integration-test/` 디렉토리가 없으면 생성합니다.
2. 사용자가 제공한 테스트 계획을 `test-plan.md`로 저장합니다.
   - 사용자가 파일 경로를 지정한 경우 → 해당 파일을 읽어서 `test-plan.md`로 복사
   - 사용자가 대화로 테스트 내용을 전달한 경우 → `test-plan.md`로 저장
   - 테스트 계획이 없으면 사용자에게 요청하고 대기
3. `test-plan.md`가 존재하는지 확인한 후 다음 단계로 진행합니다.

**테스트 계획 형식 설정에 따라:**
- `template`: `references/test-plan-template.md` 양식에 맞춰 `test-plan.md`를 구성합니다.
- `custom`: 사용자가 제공한 양식을 그대로 `test-plan.md`에 저장합니다.

**test-plan.md 작성 시 주의사항 (사용자 안내용):**
- **"viewport"라는 단어는 사용하지 마세요.** 브라우저 서브에이전트가 viewport 변경을 시도하면서 페이지 이탈이 발생할 수 있습니다.
- 스크린샷 해상도 지시는 `Take a screenshot at 1920x1080 resolution`으로 작성합니다.

---
**다음 →** [Step 2: 테스트 프롬프트 주입](step-2-inject.md)
