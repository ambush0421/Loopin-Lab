import { NextResponse } from 'next/server';

// 상권 데이터 타입 정의
export interface CommercialData {
    grade: number; // 상권 등급 (1~5, 1이 제일 높음)
    footTraffic: number; // 일평균 유동인구
    storeDensity: string; // 동종업계 밀집도 (HIGH, MEDIUM, LOW)
    primaryAgeGroup: string; // 주요 유동 연령층
    description: string; // 상권 요약
}

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address') || '';
    const bjdongCd = searchParams.get('bjdongCd') || '';

    // 실제 상권정보 API(소상공인마당 등) 연동 전, 
    // 기획안 기반의 현실적인 Mock 데이터를 반환하여 UI 및 권리금 알고리즘 연동을 테스트합니다.

    // 주소 텍스트 기반으로 대략적인 상권 티어를 나눔 (시뮬레이션 용도)
    let grade = 3;
    let footTraffic = 8500;
    let storeDensity = 'MEDIUM';
    let primaryAgeGroup = '30-40대 직장인';
    let description = '일반적인 근린상권으로 주거 지역과 오피스가 혼재되어 안정적인 수요가 예상됩니다.';

    if (address.includes('강남구') || address.includes('서초구') || address.includes('종로구') || address.includes('중구')) {
        grade = 1;
        footTraffic = Math.floor(Math.random() * (50000 - 30000 + 1)) + 30000;
        storeDensity = 'HIGH';
        primaryAgeGroup = '20-30대 직장인';
        description = '초특급 핵심 상권으로 압도적인 유동인구와 높은 소비력을 바탕으로 프리미엄 상점들의 진입 1순위 지역입니다.';
    } else if (address.includes('마포구') || address.includes('성동구') || address.includes('용산구') || address.includes('송파구')) {
        grade = 2;
        footTraffic = Math.floor(Math.random() * (30000 - 15000 + 1)) + 15000;
        storeDensity = 'HIGH';
        primaryAgeGroup = '20-30대 학생 및 직장인';
        description = '유행을 선도하는 활성화 지역으로, 트렌디한 F&B 브랜드와 리테일 상점이 밀집해 역동적인 시너지를 냅니다.';
    } else if (address.includes('광역') || address.includes('신도시')) {
        grade = 3;
        footTraffic = Math.floor(Math.random() * (15000 - 8000 + 1)) + 8000;
        storeDensity = 'MEDIUM';
        primaryAgeGroup = '30-50대 거주민';
        description = '계획된 인프라를 바탕으로 배후 세대의 소비가 중심이 되는 안정적이고 체계적인 항아리 상권입니다.';
    }

    const responseData: CommercialData = {
        grade,
        footTraffic,
        storeDensity,
        primaryAgeGroup,
        description
    };

    // 인위적인 지연 추가 (API 호출 시뮬레이션)
    await new Promise(resolve => setTimeout(resolve, 600));

    return NextResponse.json({
        success: true,
        data: responseData
    }, {
        headers: {
            'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
        }
    });
}
