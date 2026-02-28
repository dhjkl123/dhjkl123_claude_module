# 통합테스트 계획 템플릿

## 개요

이 템플릿을 사용하여 웹 프로젝트의 통합테스트 계획을 작성합니다.
프로젝트의 HTML/JSP 파일들을 분석한 후 아래 형식으로 테스트 계획을 생성하세요.

## 테스트 계획 형식

```markdown
# [프로젝트명] 통합테스트 계획

## 테스트 환경
- 로컬 서버: http://localhost:8080
- 뷰포트: 1920x1080
- 브라우저: Antigravity Browser Subagent

## 테스트 그룹

### 그룹 1: [기능 카테고리]
| TC ID | 페이지 | 설명 | 예상 결과 |
|-------|--------|------|-----------|
| TC-001 | /path/page.html | 페이지 렌더링 확인 | 정상 렌더링, 레이아웃 깨짐 없음 |
| TC-002 | /path/page.html | 메뉴 동작 확인 | 클릭 시 드롭다운 표시 |

### 그룹 2: [기능 카테고리]
| TC ID | 페이지 | 설명 | 예상 결과 |
|-------|--------|------|-----------|
| TC-003 | /path/form.html | 폼 입력 검증 | 필수 항목 미입력 시 경고 표시 |
```

## 검증 항목 가이드

### 기본 렌더링
- 페이지가 에러 없이 로드되는가
- 레이아웃이 의도대로 표시되는가
- 이미지/아이콘이 정상 로드되는가
- 텍스트가 잘리거나 겹치지 않는가

### 반응형
- 뷰포트 크기 변경 시 레이아웃 적응
- 모바일/태블릿 뷰 전환
- 미디어 쿼리 동작

### 인터랙션
- 버튼 클릭 동작
- 메뉴/드롭다운 동작
- 모달/팝업 표시/닫기
- 탭/아코디언 전환

### 폼
- 입력 필드 동작
- 유효성 검증 메시지
- 제출 동작

### 네비게이션
- 링크 이동
- 브레드크럼
- 페이지 간 전환

## 프롬프트 생성 예시

테스트 계획을 기반으로 안티그래비티에 전달할 프롬프트를 생성합니다:

```
Please test the following web pages. For each page:
1. Navigate to the URL
2. Take a screenshot
3. Verify the specified items
4. Report PASS or FAIL with details

Test Cases:

[Group: Navigation Pages]
TC-001: http://localhost:8080/index.html
- Verify: Page loads without errors
- Verify: Main navigation menu is visible
- Verify: All links are clickable
- Expected: Clean layout with working navigation

TC-002: http://localhost:8080/about.html
- Verify: Page loads without errors
- Verify: Content is properly formatted
- Expected: Text content displayed correctly

...

Report format:
TC-001: PASS/FAIL - [reason if FAIL]
TC-002: PASS/FAIL - [reason if FAIL]
```

## TC ID 규칙

- `TC-001` ~ `TC-999`: 순차 번호
- 그룹별로 번호 대역 할당 가능:
  - 001-099: 기본 렌더링
  - 100-199: 네비게이션
  - 200-299: 폼/입력
  - 300-399: 인터랙션
  - 400-499: 반응형
  - 500+: 프로젝트 고유

## 대규모 프로젝트 분할

페이지가 20개 이상이면 배치로 나누어 테스트합니다:

- **Batch 1**: 핵심 페이지 (메인, 로그인, 대시보드)
- **Batch 2**: 목록/상세 페이지
- **Batch 3**: 폼/입력 페이지
- **Batch 4**: 기타 (에러 페이지, 도움말 등)

각 배치별로 별도 프롬프트를 전송하고 결과를 수집합니다.
