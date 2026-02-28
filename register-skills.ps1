# register-skills.ps1
# dhjkl123_skills 레포의 스킬을 ~/.claude/skills/ 에 등록하는 스크립트

$prevOutputEncoding = [Console]::OutputEncoding
$prevCodePage = chcp 2>$null
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 >$null 2>&1
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ClaudeHome = Join-Path $env:USERPROFILE ".claude"
$SkillsTarget = Join-Path $ClaudeHome "skills"

# 1. 스킬 탐지
$Skills = @()

Get-ChildItem -Path $ScriptDir -Directory | ForEach-Object {
    $pluginJson = Join-Path $_.FullName ".claude-plugin\plugin.json"
    if (Test-Path $pluginJson) {
        $json = Get-Content $pluginJson -Raw -Encoding UTF8 | ConvertFrom-Json
        $Skills += [PSCustomObject]@{
            Dir         = $_.FullName
            Name        = $json.name
            Description = $json.description
        }
    }
}

if ($Skills.Count -eq 0) {
    Write-Host "발견된 스킬이 없습니다." -ForegroundColor Red
    Write-Host "각 스킬 폴더에 .claude-plugin\plugin.json 파일이 있어야 합니다."
    exit 1
}

# 2. 인터랙티브 선택 UI
$total = $Skills.Count
$selected = @($false) * $total
$cursor = 0

function Draw-Menu {
    Clear-Host

    Write-Host "=== dhjkl123_skills 스킬 등록 스크립트 ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  ↑↓ 이동  |  Space 선택  |  A 전체  |  Enter 확인" -ForegroundColor Yellow
    Write-Host ""

    for ($i = 0; $i -lt $total; $i++) {
        $check = if ($selected[$i]) { "*" } else { " " }
        $name = $Skills[$i].Name
        $desc = $Skills[$i].Description

        if ($i -eq $cursor) {
            Write-Host "  [$check] $name - $desc " -ForegroundColor White -BackgroundColor DarkCyan
        } elseif ($selected[$i]) {
            Write-Host "  [" -NoNewline
            Write-Host "$check" -ForegroundColor Green -NoNewline
            Write-Host "] $name - $desc"
        } else {
            Write-Host "  [ ] $name - $desc" -ForegroundColor DarkGray
        }
    }
    Write-Host ""
}

[Console]::CursorVisible = $false
try {
    Draw-Menu

    while ($true) {
        $key = [Console]::ReadKey($true)

        switch ($key.Key) {
            'UpArrow' {
                if ($cursor -gt 0) { $cursor-- }
            }
            'DownArrow' {
                if ($cursor -lt ($total - 1)) { $cursor++ }
            }
            'Spacebar' {
                $selected[$cursor] = -not $selected[$cursor]
            }
            'A' {
                $allSelected = ($selected | Where-Object { $_ }).Count -eq $total
                for ($i = 0; $i -lt $total; $i++) {
                    $selected[$i] = -not $allSelected
                }
            }
            'Enter' {
                break
            }
        }

        if ($key.Key -eq 'Enter') { break }

        Draw-Menu
    }
} finally {
    [Console]::CursorVisible = $true
}

# 선택된 인덱스 수집
$SelectedIndices = @()
for ($i = 0; $i -lt $total; $i++) {
    if ($selected[$i]) { $SelectedIndices += $i }
}

if ($SelectedIndices.Count -eq 0) {
    Write-Host "선택된 스킬이 없습니다." -ForegroundColor Red
    exit 0
}

Write-Host "선택됨: $($SelectedIndices.Count)개" -ForegroundColor White
Write-Host ""

# 3. 등록 실행
if (-not (Test-Path $SkillsTarget)) { New-Item -ItemType Directory -Path $SkillsTarget -Force | Out-Null }

function Copy-WithConfirm {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Label
    )

    if (Test-Path $Destination) {
        $overwrite = Read-Host "  $Label 이미 존재합니다. 덮어쓰시겠습니까? (y/N)"
        if ($overwrite -notmatch '^[yY]$') {
            Write-Host "  건너뜀: $Label" -ForegroundColor Yellow
            return
        }
    }

    if (Test-Path $Source -PathType Container) {
        Copy-Item -Path $Source -Destination $Destination -Recurse -Force
    } else {
        Copy-Item -Path $Source -Destination $Destination -Force
    }
    Write-Host "  $Label 복사 완료" -ForegroundColor Green
}

foreach ($idx in $SelectedIndices) {
    $skill = $Skills[$idx]
    Write-Host "등록 중: $($skill.Name)" -ForegroundColor Cyan

    # skills/ 복사
    $skillsSource = Join-Path $skill.Dir "skills"
    if (Test-Path $skillsSource) {
        Get-ChildItem -Path $skillsSource | ForEach-Object {
            $dest = Join-Path $SkillsTarget $_.Name
            $label = "skills\$($_.Name)"
            Copy-WithConfirm -Source $_.FullName -Destination $dest -Label $label
        }
    }

}

# 4. 결과 출력
Write-Host ""
Write-Host "=== 등록 완료 ===" -ForegroundColor Green
Write-Host "  skills → $SkillsTarget"
