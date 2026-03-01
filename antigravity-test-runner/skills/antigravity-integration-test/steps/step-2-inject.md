# Step 2: 테스트 프롬프트 주입

테스트 계획 파일의 **내용을 직접 전송하지 않습니다.** 대신 안티그래비티에게 해당 파일을 읽고 테스트를 수행하라는 짧은 프롬프트를 주입합니다.

```bash
node "$SCRIPTS_DIR/cdp-send.js" --text "Read the test plan at antigravity-integration-test/test-plan.md and execute all test cases described in it. Take screenshots at ${SCREENSHOT_RESOLUTION} resolution." --port $CDP_PORT
```

`${SCREENSHOT_RESOLUTION}`은 사용자가 Step 0에서 설정한 스크린샷 해상도입니다. (`auto`인 경우 주모니터 해상도를 감지하여 사용)

**스크린샷 해상도 감지 (`auto` 설정 시):**
```bash
# Windows
powershell -c "Add-Type -AssemblyName System.Windows.Forms; $s = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; \"$($s.Width)x$($s.Height)\""

# Linux
xrandr --current | grep '*' | head -1 | awk '{print $1}'

# macOS
system_profiler SPDisplaysDataType | grep Resolution | head -1 | awk '{print $2"x"$4}'
```

**왜 파일 경로를 전달하는가:**
- 안티그래비티 IDE가 프로젝트 폴더를 열고 있으므로 프로젝트 내 파일에 직접 접근 가능
- 긴 테스트 계획도 paste 길이 제한 없이 전달 가능
- 안티그래비티가 파일을 직접 읽고 해석하므로 마크다운 서식이 보존됨

**프롬프트 커스텀:**
- 사용자가 추가 지시사항을 요청한 경우 프롬프트에 포함합니다.
- 예: `"... Also focus on form validation and check for console errors."`

**주의사항:**
- 프롬프트가 매우 긴 경우 (10,000자+) ClipboardEvent paste가 느릴 수 있으므로 대기 시간 증가
- 프롬프트에 백틱, 큰따옴표 등 특수문자가 포함되어도 JSON.stringify로 안전하게 이스케이프됨

---
**다음 →** [Step 3: 완료 대기](step-3-poll.md)
