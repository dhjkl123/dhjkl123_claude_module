# Step 6: 결과 수집

테스트가 완료되면 결과를 읽어옵니다. (Step 5에서 자동 저장되지만, 수동으로도 가능)

```bash
node "$SCRIPTS_DIR/cdp-read.js" --output test-result.txt --port $CDP_PORT
```

특정 길이로 제한:
```bash
node "$SCRIPTS_DIR/cdp-read.js" --max-length 8000 --port $CDP_PORT
```

---
**다음 →** [Step 7: 보고서 정리](step-7-report.md)
