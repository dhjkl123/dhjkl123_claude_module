# Step 7: 보고서 정리

Step 6에서 수집한 raw 결과 파일(`test-result.txt`)을 분석하고, 스크린샷을 수집하여 마크다운 보고서를 작성합니다.

## 진행 순서

### 1. 결과 파싱

`test-result.txt`를 읽고, CSS 아티팩트 / "Thought for Ns" 등 노이즈를 무시하여 테스트 결과만 추출합니다.

**주의사항:**
- raw 결과에서 TC별 PASS/FAIL 판정과 상세 사유를 정확히 추출하세요.
- 결과가 중복 출력된 경우 (안티그래비티가 여러 번 응답) 마지막 결과를 기준으로 합니다.

### 2. 스크린샷 수집

안티그래비티 IDE의 스크린샷 저장 경로에서 파일을 수집합니다.

**스크린샷 저장 경로**: `~/.gemini/antigravity/brain/{session-id}/`

```bash
# 최근 세션 폴더 찾기
BRAIN_DIR="$HOME/.gemini/antigravity/brain"
SESSION_DIR=$(ls -td "$BRAIN_DIR"/*/ 2>/dev/null | head -1)

# 스크린샷 복사
mkdir -p "$PROJECT_ROOT/antigravity-integration-test/screenshots"
cp "$SESSION_DIR"/*.png "$PROJECT_ROOT/antigravity-integration-test/screenshots/" 2>/dev/null
```

### 3. 보고서 생성

보고서 형식 설정에 따라 `test-report.md`를 생성합니다.

- `template` (기본값): `references/test-report-template.md` 양식에 맞춰 보고서를 생성합니다.
- `custom`: 사용자가 지정한 양식 파일을 참고하여 보고서를 생성합니다.

**보고서 내 이미지 참조:**
- 복사한 스크린샷을 상대 경로로 포함합니다.
- 예: `![TC-001 메인 페이지](./screenshots/tc001_main_page_1772285055973.png)`
- TC ID와 스크린샷 파일명을 매칭하여 각 TC 상세 섹션에 삽입합니다.

### 4. 결과 안내

사용자에게 보고서 요약을 출력하고, 파일 경로를 안내합니다.

**최종 결과 파일 구조:**
```
$PROJECT_ROOT/
└── antigravity-integration-test/
    ├── test-plan.md
    ├── test-result.txt
    ├── test-report.md
    └── screenshots/
        ├── tc001_main_page_xxx.png
        ├── tc002_about_page_xxx.png
        └── tc003_contact_xxx.png
```

- 보고서 파일명은 항상 `test-report.md`로 고정합니다.

---
**완료.** 모든 단계가 끝났습니다.
