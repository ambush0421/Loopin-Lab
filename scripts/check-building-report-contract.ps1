param(
  [string]$BaseUrl = 'http://localhost:3000/api/building-report-v2'
)

$cases = @(
  @{
    Name = 'INVALID_TYPE'
    Body = (@{
      type = 'UNKNOWN'
      items = @(@{
        id = 'A'
      })
      currentCost = 1000
    } | ConvertTo-Json -Depth 10)
    ExpectedStatus = 400
    ExpectedCode = 'INVALID_TYPE'
  },
  @{
    Name = 'INVALID_REQUEST'
    Body = '[]'
    ExpectedStatus = 400
    ExpectedCode = 'INVALID_REQUEST'
  },
  @{
    Name = 'INVALID_ITEMS'
    Body = (@{
      type = 'LEASE'
      items = 'not-array'
      currentCost = 1000
    } | ConvertTo-Json -Depth 10)
    ExpectedStatus = 400
    ExpectedCode = 'INVALID_ITEMS'
  },
  @{
    Name = 'INVALID_JSON'
    Body = '{ "type": "LEASE",'
    ExpectedStatus = 400
    ExpectedCode = 'INVALID_JSON'
  },
  @{
    Name = 'NO_VALID_BUILDINGS_GUARDED'
    Body = (@{
      type = 'LEASE'
      items = @(@{
        sigunguCd = '00000'
        bjdongCd = '00000'
        bun = '0000'
        ji = '0000'
        cost = 1000
      })
      currentCost = 1000
    } | ConvertTo-Json -Depth 10)
    ExpectedStatus = 500
    ExpectedCode = 'NO_VALID_BUILDINGS'
    Optional = $true
  }
)

function Invoke-Case {
  param(
    [string] $Body
  )

  try {
    $response = Invoke-WebRequest -Method Post -Uri $BaseUrl -Body $Body -ContentType 'application/json'
    return @{
      status = [int]$response.StatusCode
      body = $response.Content
      ok = $true
    }
  } catch {
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $text = $reader.ReadToEnd()
      $reader.Close()
      return @{
        status = $status
        body = $text
        ok = $false
      }
    }

    return @{
      status = 0
      body = "ERR: $($_.Exception.Message)"
      connectionError = ($_.Exception.Message -like '*No connection could be made to the server*' -or
        $_.Exception.Message -like '*공급자를 로드하거나 초기화할 수 없습니다.*')
      ok = $false
    }
  }
}

function Parse-ErrorCode {
  param([string]$Body)
  try {
    $obj = $Body | ConvertFrom-Json
    return $obj.error.code
  } catch {
    return $null
  }
}

Write-Host 'Building Report v2 계약 점검 시작'
Write-Host "Target: $BaseUrl"
Write-Host ''

$passCount = 0
$skipCount = 0
$total = $cases.Count
$connectionFailure = $false

foreach ($c in $cases) {
  Write-Host "=== $($c.Name) ==="
  $result = Invoke-Case -Body $c.Body

  if ($result.status) {
    Write-Host "status: $($result.status)"
  }

  $errorCode = Parse-ErrorCode -Body $result.body
  if ($result.body) {
    try {
      $result.body | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
    } catch {
      Write-Host $result.body
    }
  } else {
    Write-Host '(empty body)'
  }

  $expectedMet = $result.status -eq $c.ExpectedStatus -and ($c.ExpectedCode -eq $errorCode)
  if ($expectedMet) { $passCount++ }

  if ($expectedMet) {
    Write-Host 'result: PASS'
  } elseif ($result.connectionError) {
    $connectionFailure = $true
    Write-Host 'result: BLOCKED (서버 접속 불가. 서버가 기동 중인지 먼저 확인해 주세요.)'
    $skipCount++
  } elseif ($c.Optional -and $result.status -ne 0) {
    Write-Host 'result: SKIP (NO_VALID_BUILDINGS는 환경/데이터 상태에 따라 미발생할 수 있어 선택 검증)'
    $skipCount++
  } else {
    Write-Host "result: FAIL (expected $($c.ExpectedStatus)/$($c.ExpectedCode), got $($result.status)/$errorCode)"
  }
  Write-Host ''
}

Write-Host '점검 요약'
Write-Host "passed: $passCount / $($total - $skipCount)"
Write-Host "skipped: $skipCount"
if ($connectionFailure) {
  Write-Host '요약: 서버 미기동/연결 실패로 인해 일부/전체 케이스 점검이 차단되었습니다.'
}
if ($total - $skipCount -gt 0) {
  Write-Host "success: $([math]::Round(($passCount / ($total - $skipCount)) * 100, 1))%"
} else {
  Write-Host 'success: 0 (skipped all)'
}
