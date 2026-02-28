# Step 4: 테스트 프롬프트 주입

`antigravity-integration-test/test-plan.md` 파일을 읽어서 안티그래비티에 전송합니다.

```bash
node "$SCRIPTS_DIR/cdp-send.js" "$PROJECT_ROOT/antigravity-integration-test/test-plan.md" --port $CDP_PORT
```

**주의사항:**
- 프롬프트가 매우 긴 경우 (10,000자+) ClipboardEvent paste가 느릴 수 있으므로 대기 시간 증가
- 프롬프트에 백틱, 큰따옴표 등 특수문자가 포함되어도 JSON.stringify로 안전하게 이스케이프됨

---
**다음 →** [Step 5: 완료 대기](step-5-poll.md)
