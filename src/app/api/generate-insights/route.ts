import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const runtime = 'edge';

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
    try {
        const { type, data } = await req.json();

        // openai.apiKey 속성은 직접 읽을 수 없으므로(TypeScript Error), 환경 변수를 직접 검사합니다.
        const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'AI API 키가 설정되지 않았습니다.' }, { status: 500 });
        }

        let systemPrompt = '';

        if (type === 'risk_analysis') {
            systemPrompt = `당신은 대한민국 최고 수준의 상업용 부동산 수석 권리 분석가(Legal & Risk Analyst)입니다.
주어진 건축물대장 및 위치 데이터를 분석하여, 매입 혹은 임차 시 고객이 반드시 알아야 할 "치명적 리스크(Dealbreaker)"와 "투자/실사용 유의사항"을 3문장 이내로 명확하게 요약하십시오.

[출력 제어 원칙]
1. 감정적 과장("절대 사면 안 됩니다", "대박입니다") 금지. 신뢰할 수 있는 컨설팅 톤 앤 매너 유지.
2. 해결 가능한 리스크(예: 단순 위반건축물)와 불가능한 리스크(예: 주차대수 0, 승강기 0 등)를 구분하여 서술할 것.
3. 데이터가 부족할 경우 거짓된 정보를 지어내지 말고, "추가 확인이 필요함"으로 갈음할 것 (Hallucination 억제).

[분석할 데이터]
${JSON.stringify(data, null, 2)}`;
        } else if (type === 'executive_summary') {
            systemPrompt = `당신은 글로벌 탑티어 상업용 부동산 PF 자문사(Financial Advisor)입니다.
고객이 시뮬레이션한 자금조달 계획과 1차년도 추정 현금흐름표(ProForma) 데이터를 제공합니다. 
이를 바탕으로 C-Level 경영진이 투심위(투자심의위원회)에서 10초 만에 읽고 의사결정할 수 있는 '투자의 핵심'을 3~4개의 Bullet Point로 요약하십시오.

[지시사항]
1. 첫 문장은 항상 총 투자 규모(Uses)와 핵심 자기자본(Net Equity) 및 LTV를 언급.
2. 두 번째 문장은 순영업소득(NOI), 자본환원율(Cap Rate), 실투자 수익률(ROI/Cash-on-Cash)을 통한 타당성을 서술.
3. 법률, 세제(취득세 등), 금리에 따른 리스크를 우회적으로 명시하는 안전장치(Disclaimer) 역할을 할 것.
4. 화려한 수식어구 배제. 건조하고 프로페셔널한 문체 사용 (예: "~로 분석됨", "~할 것으로 추정됨").

[분석할 재무 시뮬레이션 데이터]
${JSON.stringify(data, null, 2)}`;
        } else {
            return NextResponse.json({ error: '유효하지 않은 AI анализа 타입입니다.' }, { status: 400 });
        }

        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.2, // 보수적이고 일관된 결과 도출
        });

        return NextResponse.json({ result: text });
    } catch (error: any) {
        console.error('AI Insight Generation Error:', error);
        return NextResponse.json({ error: 'AI 분석 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }
}
