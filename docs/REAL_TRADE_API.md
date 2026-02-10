# 부동산 시세 API 검토 보고서

## 📊 구현 완료: 국토부 실거래가 API

### 사용 가능한 API (공공데이터포털)

| API 명 | 데이터 | 비용 | 승인 |
|--------|--------|------|------|
| 상업업무용 부동산 매매 실거래가 | 상가/오피스 매매 | 무료 | 자동 승인 |
| 오피스텔 매매 실거래가 | 오피스텔 매매 | 무료 | 자동 승인 |
| 오피스텔 전월세 실거래가 | 오피스텔 임대 | 무료 | 자동 승인 |
| 아파트 매매 실거래가 | 아파트 매매 | 무료 | 자동 승인 |
| 아파트 전월세 실거래가 | 아파트 임대 | 무료 | 자동 승인 |

### 조회 가능 정보
- ✅ 거래일자 (년/월/일)
- ✅ 거래금액
- ✅ 전용면적
- ✅ 층 정보
- ✅ 건축년도
- ✅ 건물명 (오피스텔)
- ⚠️ 지번 (일부만 공개)
- ❌ 정확한 호수

### 평당가 계산
```
평당가 = 거래금액 ÷ (전용면적 × 0.3025)
```

---

## 🚫 네이버 부동산 크롤링 검토

### 결론: **권장하지 않음**

### 법적 문제
1. **저작권법 위반 가능성**
   - 네이버 부동산 데이터는 DB 저작권 보호 대상
   - 자동화된 크롤링 시 법적 분쟁 우려

2. **컴퓨터프로그램보호법**
   - robots.txt 무시 시 법적 책임
   - 네이버 이용약관 위반

3. **업무방해죄**
   - 과도한 요청으로 서버 부하 시 업무방해

### 기술적 문제
1. **Anti-Bot 시스템**
   - 네이버는 강력한 크롤링 차단 시스템 운영
   - CAPTCHA, IP 차단, Rate Limiting

2. **DOM 구조 변경**
   - 네이버는 수시로 HTML 구조 변경
   - 크롤러 유지보수 부담 증가

3. **동적 렌더링**
   - JavaScript 기반 SPA 구조
   - Puppeteer/Playwright 필요 → 서버 비용 증가

### 대안
1. **직방 API** (비공식)
   - 상대적으로 덜 엄격하나 여전히 비공식
   
2. **호갱노노 API** (비공식)
   - 실거래가 기반, 비공식 API

3. **KB부동산 시세** (공식)
   - 월간 시세 지수 제공, API 공식 지원

---

## 🔧 현재 구현 상태

### 파일 구조
```
src/
├── app/api/
│   ├── building-report-v2/route.ts  # 건축물대장
│   ├── building-units/route.ts      # 호실 정보
│   └── real-trade/route.ts          # 실거래가 (NEW)
└── components/dashboard/
    └── RealTradeChart.tsx           # 실거래가 표시 (NEW)
```

### API 엔드포인트
```
GET /api/real-trade?lawdCd=11680&type=officetel

Query Parameters:
- lawdCd: 법정동 코드 앞 5자리 (필수)
- type: commercial | officetel (기본: officetel)
- buildingName: 건물명 필터 (선택)
- dong: 동 이름 (선택)
```

### 응답 예시
```json
{
  "success": true,
  "data": {
    "trades": [...],
    "rents": [...],
    "stats": {
      "trade": {
        "count": 15,
        "avgPricePerPyung": 25000000,
        "minPricePerPyung": 20000000,
        "maxPricePerPyung": 32000000,
        "recentTrades": [...]
      },
      "rent": {
        "count": 28,
        "avgDepositPerPyung": 500000,
        "avgMonthlyPerPyung": 50000
      }
    }
  }
}
```

---

## 📋 추가 API 키 등록 필요

현재 `BUILDING_API_KEY`를 실거래가 API에도 사용하도록 구현했습니다.
만약 별도 키가 필요하다면 `.env.local`에 추가해주세요:

```env
# 실거래가 API (선택적 - 별도 키 필요시)
REAL_TRADE_API_KEY=your-key-here
```

---

## 🔮 향후 개선 방향

1. **KB부동산 시세 연동** (공식 API 지원)
2. **법정동 코드 자동 변환** (주소 → lawdCd)
3. **시계열 차트** (가격 변동 추이)
4. **지역 비교** (주변 동 대비 시세)

---

*작성일: 2024년*
