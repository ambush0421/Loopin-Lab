# building-report-v2 API 에러 응답 계약

이 문서는 `/api/building-report-v2` 에러 응답의 일관된 형식을 정의합니다.

## 공통 에러 응답 구조

요청 검증 실패/시스템 오류 발생 시 응답 본문은 아래 형태를 따릅니다.

```ts
{
  error: {
    code: 'ERROR_CODE',
    message: '사람이 읽을 수 있는 메시지',
    field: '잘못된 필드명 (선택)',
    details: '추가 설명 (선택)'
  }
}
```

- `code`: 내부 분류 코드(문자열)
- `message`: 사용자/로그용 메시지
- `field`: 문제 발생 입력 필드(가능한 경우)
- `details`: 보조 설명(가능한 경우)

HTTP 상태 코드는 다음 표를 따릅니다.

| 상태 | code | 설명 |
|---|---|---|
| 400 | INVALID_REQUEST | 요청 본문 형식이 객체가 아님 |
| 400 | INVALID_JSON | JSON 파싱 실패 |
| 400 | INVALID_TYPE | `type` 값이 `LEASE|PURCHASE|INVEST`가 아님 |
| 400 | INVALID_ITEMS | 후보물건 입력이 없거나 배열이 아님 |
| 500 | NO_VALID_BUILDINGS | 외부 API 응답에서 유효한 후보물건이 없음 |
| 500 | INTERNAL_ERROR | 예상치 못한 서버 에러 |

## 클라이언트 처리 권장

프론트에서는 아래 순서로 렌더링합니다.

1. `error.code` 기반 고정 메시지 변환
2. `error.field`가 있으면 항목 표기
3. `error.details`가 있으면 보조 문구로 노출

샘플:

```text
요청 type은 LEASE, PURCHASE, INVEST 중 하나여야 합니다. (분석 유형(type)): type 값이 잘못 입력됨
```

## 계약 샘플 (성공/실패)

### 성공 응답(요청 가중치 적용)

```ts
{
  meta: {
    type: 'LEASE',
    timestamp: '2026-03-01T10:00:00.000Z',
    requestedWeights: { costScore: 5, areaScore: 3, parkingScore: 1, modernityScore: 1 },
    normalizedWeights: { costScore: 0.5, areaScore: 0.3, parkingScore: 0.1, modernityScore: 0.1 },
    weights: { costScore: 0.5, areaScore: 0.3, parkingScore: 0.1, modernityScore: 0.1 },
    weightSource: 'request',
    weightRuleSummary: '요청 가중치의 각 항목(미입력/0/음수 제외)은 합계 100% 기준으로 정규화되어 최종 반영됩니다.',
    weightNotice: '요청 가중치 일부만 적용되었으며, 누락 항목은 기본 가중치가 보완됩니다.',
    latency: '120.45ms',
  },
  recommendation: { bestBuildingIndex: 0, reason: '...' , totalScore: 89.7 },
  buildings: [{ id: 'a', name: '...', analysis: { score: 89.7 } }]
}
```

### 성공 응답(요청 가중치 미적용)

```ts
{
  meta: {
    type: 'PURCHASE',
    timestamp: '2026-03-01T10:00:00.000Z',
    normalizedWeights: { costScore: 0.4, areaScore: 0.3, parkingScore: 0.2, modernityScore: 0.1 },
    weights: { costScore: 0.4, areaScore: 0.3, parkingScore: 0.2, modernityScore: 0.1 },
    weightSource: 'fallback',
    weightRuleSummary: '요청 가중치가 유효하지 않아 기본 가중치 기반으로 계산했습니다.',
    weightNotice: '요청 가중치가 모두 0이거나 유효하지 않아 기본 가중치 기준으로 계산했습니다.',
    latency: '98.12ms',
  },
  recommendation: { bestBuildingIndex: 1, reason: '...' , totalScore: 84.2 },
  buildings: [{ id: 'a', name: '...' }, { id: 'b', name: '...' }]
}
```

### 실패 응답(에러)

```ts
{
  error: {
    code: 'INVALID_ITEMS',
    message: '후보 물건 목록 형식이 올바르지 않습니다.',
    field: 'items',
    details: 'items는 배열이어야 합니다.'
  }
}
```

### 에러 코드별 샘플

#### INVALID_TYPE (400)

```ts
{
  error: {
    code: 'INVALID_TYPE',
    message: '요청 type은 LEASE, PURCHASE, INVEST 중 하나여야 합니다.',
    field: 'type'
  }
}
```

#### INVALID_JSON (400)

```ts
{
  error: {
    code: 'INVALID_JSON',
    message: '요청 본문이 올바른 JSON 형식이 아닙니다.'
  }
}
```

#### INVALID_REQUEST (400)

```ts
{
  error: {
    code: 'INVALID_REQUEST',
    message: '요청 본문 형식이 올바르지 않습니다.',
    field: 'body'
  }
}
```

#### INVALID_ITEMS (400)

```ts
{
  error: {
    code: 'INVALID_ITEMS',
    message: '후보 물건 목록 형식이 올바르지 않습니다.',
    field: 'items'
  }
}
```

#### NO_VALID_BUILDINGS (500)

```ts
{
  error: {
    code: 'NO_VALID_BUILDINGS',
    message: '입력한 후보 물건 중 유효한 건물 데이터를 불러오지 못했습니다.',
    field: 'items'
  }
}
```

#### INTERNAL_ERROR (500)

```ts
{
  error: {
    code: 'INTERNAL_ERROR',
    message: '현재 서버 처리 중 일시적인 오류가 발생했습니다.',
    details: '개발 환경에서만 노출되는 내부 메시지 (선택)'
  }
}
```

## 백엔드/프론트 공통 상수 위치

- `src/lib/constants/building-report.ts`
  - `API_ERROR_CODE_MESSAGES`, `API_ERROR_FIELD_LABELS`
  - `WEIGHT_KEY_LABELS`, `WEIGHT_SOURCE_LABELS`, `WEIGHT_KEY_ORDER`, `WEIGHT_RULE_SUMMARIES`
  - `WeightInput`, `WeightMeta`, `ReportType`, `WeightSource`, `WeightKey`, `ApiErrorResponse`
- `src/lib/types/building-report.ts`
  - `ComparisonBuilding`, `Recommendation`, `RiskLevel`, `BuildingMetricValues`, `BuildingTagValues`, `CompareWeightInput`, `CompareResponse`

## API 성공 응답에서 활용되는 가중치 메타

성공 응답 `meta`에는 다음 필드가 포함될 수 있습니다.

```ts
{
  type,
  timestamp,
  requestedWeights,
  normalizedWeights,
  weights,
  weightSource,
  weightRuleSummary,
  weightNotice,
}
```

- `weightRuleSummary`: 가중치 적용 방식(요청 기반/기본 가중치 기반)을 한 줄로 저장합니다.

## API/클라이언트 공통 성공 응답 타입

성공 응답 전체는 `CompareResponse` 타입으로 공유합니다.

```ts
export type CompareResponse = {
  meta: WeightMeta;
  recommendation: {
    bestBuildingIndex: number;
    reason: string;
    totalScore: number;
  };
  buildings: ComparisonBuilding[];
};
```

`buildings`는 화면(PDF/비교표)에서 사용하는 동일 `Building` 스키마를 갖습니다.
백엔드에서는 계산 결과에 `reportType`을 추가해 내려주며, 프런트는 `meta.type`/`reportType` 기반으로 화면 라우팅 및 라벨링에 사용합니다.

## 가중치 적용 문자열/라벨 중앙화

- 가중치 라벨: `WEIGHT_KEY_LABELS`
- 가중치 적용 방식 라벨: `WEIGHT_SOURCE_LABELS`
- 가중치 적용 규칙: `WEIGHT_RULE_SUMMARIES` + `weight-display.ts` (`formatWeightSummary`, `buildWeightDisplayRows`, `getWeightSourceLabel`)
- PDF 출력에서 규칙 문구는 `meta.weightRuleSummary`가 있으면 우선 사용하고, 없을 때만 `WEIGHT_RULE_SUMMARIES[weightSource]` fallback 사용
- 기본 요청 실패/성공 가중치 메시지: `API_ERROR_CODE_MESSAGES`, `API_ERROR_FIELD_LABELS`

## 운영 점검 체크리스트 (계약 정합성)

- [ ] `/api/building-report-v2` 실패 응답이 `ApiErrorResponse` 형태인지 확인
- [ ] 성공 응답이 `CompareResponse` 스키마( `meta + recommendation + buildings` )인지 확인
- [ ] 가중치 요약 텍스트가 `formatWeightSummary`로만 생성되는지 확인
- [ ] 요청/정규화/최종 가중치 라인은 `buildWeightDisplayRows`를 공통 사용
- [ ] PDF/웹 화면의 가중치 방식 라벨이 `getWeightSourceLabel`를 사용
- [ ] 400/500 실패 케이스 각각 최소 1개 수동 점검
- [ ]  `WEIGHT_KEY_ORDER` 순서가 변경될 경우 3개 화면(PDF/웹/API) 출력이 일괄 반영되는지 확인

## 권장 3가지 진행 순서

모든 점검은 로컬 서버 기동 상태(예: `http://localhost:3000`)에서 실행합니다.

`./scripts/check-building-report-contract.ps1`를 사용하면 아래 3가지를 한 번에 실행할 수 있습니다.

```powershell
& .\scripts\check-building-report-contract.ps1 -BaseUrl http://localhost:3000/api/building-report-v2
```

실행 시 `BLOCKED`가 반복되면 먼저 로컬 서버를 기동하세요.

```powershell
npm run dev
```

### 운영 점검 시 권장 3가지 순서

1) 실패 케이스 점검
- 스크립트로 `INVALID_TYPE/INVALID_REQUEST/INVALID_ITEMS/INVALID_JSON/NO_VALID_BUILDINGS` 응답을 수집해 `code/message` 일치 여부 확인

2) 계약 가시화 점검
- PDF/웹에서 가중치 표시 문자열이 문서의 `formatWeightSummary`/`buildWeightDisplayRows`와 동일한지 확인

3) 가중치 키 순서 점검
- `WEIGHT_KEY_ORDER` 변경 후 API 응답과 화면 출력의 라벨 순서 일치 여부를 화면/문서까지 반영해 갱신

참고: NO_VALID_BUILDINGS는 환경/API 응답 상태에 따라 달라질 수 있어, 외부 API 응답이 확실히 무효가 되도록 스테이징/모의 데이터로 검증하면 가장 안정적입니다.
 
## 문서-코드 정합 점검 결과(현재 반영)

- `reportType`은 건물 객체(`buildings[].reportType`)에 포함되며, UI/문서에서는 건물 타입 분기용으로 사용됨
- 가중치 규칙 텍스트 출력은 `meta.weightRuleSummary`를 우선 사용하고, 없으면 `WEIGHT_RULE_SUMMARIES[weightSource]` fallback(현재 `fallback` 기본값)을 사용

## 운영 체크리스트 상태 업데이트

- [x] `/api/building-report-v2` 실패 응답이 `ApiErrorResponse` 형태를 따르도록 타입/구현 정합
- [x] 성공 응답이 `CompareResponse` 스키마( `meta + recommendation + buildings` )로 정리
- [x] 가중치 요약 텍스트가 `formatWeightSummary`로만 생성되도록 정합화
- [x] 요청/정규화/최종 가중치 라인에 `buildWeightDisplayRows` 적용
- [x] PDF/웹 화면의 가중치 방식 라벨이 `getWeightSourceLabel` 사용
- [ ] 400/500 실패 케이스 각각 최소 1개 수동 점검
  - 현재 실행은 `local 서버 미기동` 상태라 BLOCKED로 대기
- [ ] `WEIGHT_KEY_ORDER` 순서 변경 시 PDF/웹/API 동시 반영되는지 수동 검증
