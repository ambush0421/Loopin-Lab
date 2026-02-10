# 지도 API 설정 가이드

## 1. 카카오맵 API (추천) - 무료

### 무료 한도
- **지도 API**: 일 최대 30만 건
- **로컬 API (검색)**: 일 최대 10만 건
- **통합**: 월 300만 건

### API 키 발급 절차

1. **카카오 개발자 사이트 가입**
   - https://developers.kakao.com 접속
   - 카카오 계정으로 로그인

2. **애플리케이션 등록**
   - [내 애플리케이션] 클릭
   - [애플리케이션 추가하기] 클릭
   - 앱 이름: "Building Report Pro" (자유롭게)
   - 사업자명: 개인이면 본인 이름

3. **플랫폼 등록**
   - 생성된 앱 클릭
   - [플랫폼] 메뉴 선택
   - [Web] 플랫폼 등록
   - 사이트 도메인 입력:
     - 개발용: `http://localhost:3000`
     - 배포용: `https://your-domain.com`

4. **JavaScript 키 복사**
   - [앱 키] 메뉴에서 **JavaScript 키** 복사
   - (REST API 키가 아님!)

5. **.env.local에 설정**
   ```env
   NEXT_PUBLIC_KAKAO_MAP_KEY=발급받은_JavaScript_키
   ```

6. **서버 재시작**
   ```bash
   npm run dev
   ```

### 주의사항 (2024.12.01 이후)
- 신규 앱은 **활성화 설정** 필요
- [내 애플리케이션] → [앱 설정] → [지도 API 활성화]

---

## 2. OpenStreetMap + Leaflet (백업) - 완전 무료

### 장점
- API 키 불필요
- 완전 무료 (무제한)
- 오픈소스

### 단점
- 한국 지도 상세도가 카카오/네이버보다 낮음
- 로드뷰 없음

### 이 프로젝트에서
카카오맵 키가 없을 경우 자동으로 Leaflet(OSM) 버전으로 표시됩니다.

---

## 3. 네이버 지도 (참고)

### 주의: 2025년 정책 변경
- 2025.04.17: 기존 API 신규 이용 차단
- 2025.07.01: 무료 이용량 제공 중단 (100% 유료)
- 신규 Maps API 출시 (2025.03.20)

### 결론
네이버 지도는 정책 불확실성으로 **권장하지 않음**

---

## 현재 프로젝트 설정

### 환경 변수 (.env.local)
```env
# 카카오맵 API 키 (프론트엔드 사용)
NEXT_PUBLIC_KAKAO_MAP_KEY=your_javascript_key_here

# 건축물대장 API 키 (백엔드 전용)
BUILDING_API_KEY=your_building_api_key_here
```

### 지도 표시 우선순위
1. 카카오맵 키 있음 → 카카오맵 표시
2. 카카오맵 키 없음 → OpenStreetMap(Leaflet) 표시

---

*작성일: 2024년*
