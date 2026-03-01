# Step 6: 결과 수집

테스트가 완료되면 결과를 읽어옵니다. (Step 5에서 자동 저장되지만, 수동으로도 가능)

```bash
node "$SCRIPTS_DIR/cdp-read.js" --output test-result.txt --port $CDP_PORT
```

특정 길이로 제한:
```bash
node "$SCRIPTS_DIR/cdp-read.js" --max-length 8000 --port $CDP_PORT
```

**결과 파일 확인:**
- `test-result.txt`가 정상적으로 저장되었는지 확인
- 내용이 비어있거나 너무 짧으면 (1000자 미만) 안티그래비티가 아직 실행 중일 수 있음 → Step 5로 돌아가 폴링 재실행

---
**다음 →** [Step 5: 보고서 정리](step-5-report.md)
