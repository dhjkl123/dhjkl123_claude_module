# CLAUDE.md

이 레포지토리는 Claude Code의 기능을 확장하는 Hooks와 Skills 모듈 모음입니다.

## 프로젝트 구조

```
dhjkl123_claude_module/
├── hooks/                          # Claude Code 이벤트 훅 모듈
│   └── alarm_hook/
├── skills/                         # Claude Code 커스텀 스킬 모듈
│   └── antigravity-test-runner/
├── register-skills.sh              # 스킬 등록 (Linux/Mac)
├── register-skills.ps1             # 스킬 등록 (Windows PowerShell)
└── register-skills.bat             # 스킬 등록 (Windows 배치 래퍼)
```

## README 작성 규칙

### 루트 README.md

- 레포지토리 전체 개요
- 구조 트리
- 모듈 요약은 **폴더별(Hooks / Skills)로 섹션을 분리**하여 테이블로 작성
- 설치 방법, 요구사항 포함
- 요구사항의 외부 도구는 **공식 홈페이지 링크**를 첨부 (Windows 같은 OS는 제외)

### 하위 폴더 README.md (hooks/, skills/)

- 상단에 폴더 설명 1줄
- **공통 섹션**(등록 방법 등)은 모듈 토글 바깥 상단에 배치
  - 직접 JSON 예시를 넣지 않고, **Claude Code 공식 문서 링크**로 대체
- 각 모듈은 `<summary>/<details>` **토글**로 감싸서 접힘/펼침 가능하게 작성
  - `<summary>` 태그 안에 모듈명(`<h2>`)과 한 줄 설명을 넣음
  - `<details>` 태그는 `<summary>` **아래**에 위치
- 모듈 토글 내부 구성 순서:
  1. 파일 구조 (트리)
  2. 설정 항목 (테이블)
  3. 실행 Flow (**Mermaid flowchart** 사용)
  4. 스크립트/컴포넌트 상세 (테이블)
  5. 핵심 기술 패턴 (리스트)

### Mermaid 플로우차트 규칙

- `flowchart TD` (위→아래) 사용
- 각 Step은 `subgraph`로 그룹핑
- 조건 분기는 `{}` 다이아몬드 노드 사용
- 루프(폴링, 재시도)는 화살표로 이전 노드를 가리켜 표현
- 시작/끝은 `([텍스트])` 라운드 노드 사용

### 언어 및 스타일

- 문서는 **한국어**로 작성
- 외부 도구/라이브러리 언급 시 공식 홈페이지 링크 첨부
- 테이블은 GitHub-Flavored Markdown 사용
- 불필요한 이모지 사용 금지
