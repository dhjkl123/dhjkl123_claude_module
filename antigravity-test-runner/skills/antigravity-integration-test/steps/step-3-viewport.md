# Step 3: 뷰포트 설정 프롬프트 전송

`antigravity-integration-test/viewport-prompt.md` 파일을 읽어서 안티그래비티에 전송합니다.

Step 1에서 파일이 아직 없으면 **뷰포트 크기 설정값을 반영하여** 자동 생성합니다.

**뷰포트 크기 결정:**
- 사용자가 `1280x720` 등으로 직접 지정한 경우 → 해당 값 사용
- `auto` (기본값) → 주모니터 해상도를 자동 감지하여 사용:
  ```bash
  # Windows
  powershell -c "Add-Type -AssemblyName System.Windows.Forms; $s = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; \"$($s.Width)x$($s.Height)\""

  # Linux (xrandr)
  xrandr --current | grep '*' | head -1 | awk '{print $1}'

  # macOS
  system_profiler SPDisplaysDataType | grep Resolution | head -1 | awk '{print $2"x"$4}'
  ```

감지된 (또는 지정된) 뷰포트 크기를 `$VIEWPORT`에 저장하고 프롬프트를 생성합니다:
```
Set the browser viewport to $VIEWPORT pixels. After setting, confirm the viewport dimensions.
```

```bash
node "$SCRIPTS_DIR/cdp-send.js" "$PROJECT_ROOT/antigravity-integration-test/viewport-prompt.md" --port $CDP_PORT
```

뷰포트 설정이 완료될 때까지 잠시 대기합니다 (보통 10-15초).

---
**다음 →** [Step 4: 테스트 프롬프트 주입](step-4-inject.md)
