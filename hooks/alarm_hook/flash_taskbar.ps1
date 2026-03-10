# flash_taskbar.ps1
# Windows API FlashWindowEx를 호출하여 현재 터미널 창을 작업표시줄에서 깜빡이게 함

Add-Type @"
using System;
using System.Runtime.InteropServices;

public class WindowFlasher {
    [StructLayout(LayoutKind.Sequential)]
    public struct FLASHWINFO {
        public uint cbSize;
        public IntPtr hwnd;
        public uint dwFlags;
        public uint uCount;
        public uint dwTimeout;
    }

    [DllImport("user32.dll")]
    public static extern bool FlashWindowEx(ref FLASHWINFO pwfi);

    [DllImport("kernel32.dll")]
    public static extern IntPtr GetConsoleWindow();

    // FLASHW_ALL: 작업표시줄 버튼 + 타이틀바 모두 깜빡임
    public const uint FLASHW_ALL = 3;
    // FLASHW_TIMERNOFG: 포커스 받을 때까지 계속 깜빡임
    public const uint FLASHW_TIMERNOFG = 12;

    public static void Flash(IntPtr hwnd, uint count) {
        FLASHWINFO fwi = new FLASHWINFO();
        fwi.cbSize = (uint)Marshal.SizeOf(typeof(FLASHWINFO));
        fwi.hwnd = hwnd;
        fwi.dwFlags = FLASHW_ALL | FLASHW_TIMERNOFG;
        fwi.uCount = count;
        fwi.dwTimeout = 0;
        FlashWindowEx(ref fwi);
    }
}
"@

# 현재 콘솔 윈도우 핸들 가져오기
$hwnd = [WindowFlasher]::GetConsoleWindow()

if ($hwnd -ne [IntPtr]::Zero) {
    # 5회 깜빡임 + 포커스 받을 때까지 유지
    [WindowFlasher]::Flash($hwnd, 5)
} else {
    Write-Error "콘솔 윈도우를 찾을 수 없습니다."
    exit 1
}
