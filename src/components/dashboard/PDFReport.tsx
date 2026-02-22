'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import {
  toSafeNumber,
  formatManwon,
  formatSignedManwon,
  formatSignedBillionFromManwon
} from '@/lib/utils/finance-format';
import {
  WEIGHT_RULE_SUMMARIES,
} from '@/lib/constants/building-report';
import {
  buildWeightDisplayRows,
  formatWeightSummary,
  getWeightSourceLabel,
} from '@/lib/utils/weight-display';
import { type CompareResponse } from '@/lib/types/building-report';

// 한글 폰트 등록 (Pretendard-like CDN 폰트 또는 시스템 폰트 활용)
// 실제 환경에서는 로컬 폰트 파일을 사용하는 것이 안전함
Font.register({
  family: 'NanumGothic',
  src: 'https://fonts.gstatic.com/s/nanumgothic/v17/PN_oRbmGL072gcIdZk083_m7H_mPsOfubPk.ttf',
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NanumGothic',
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
  },
  coverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  coverSub: {
    fontSize: 14,
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 15,
    borderBottom: '2 solid #2563EB',
    paddingBottom: 5,
  },
  summaryCard: {
    backgroundColor: '#F1F5F9',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  recommendationLabel: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bestBuildingName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#475569',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#F8FAFC',
  },
  tableCellLabel: {
    width: '25%',
    fontSize: 10,
    fontWeight: 'bold',
    paddingLeft: 10,
    color: '#64748B',
  },
  tableCellData: {
    width: '25%',
    fontSize: 10,
    paddingLeft: 10,
    color: '#1E293B',
  },
  bestCell: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94A3B8',
    borderTop: '1 solid #E2E8F0',
    paddingTop: 10,
  },
  weightSummaryBlock: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  weightSummaryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  weightSummaryLine: {
    fontSize: 9,
    marginBottom: 4,
    color: '#475569',
  },
  weightSummaryWarning: {
    fontSize: 9,
    marginTop: 4,
    color: '#B45309',
  },
  weightSummaryRule: {
    fontSize: 8,
    marginTop: 6,
    color: '#64748B',
  },
  weightSupplementRow: {
    fontSize: 9,
    marginTop: 4,
    color: '#334155',
  },
  missingBadge: {
    fontSize: 7,
    color: '#DC2626',
    marginTop: 2,
  }
});

type ReportData = CompareResponse;

interface PDFReportProps {
  data: ReportData;
}

export const PDFReport = ({ data }: PDFReportProps) => {
  const { buildings, recommendation, meta } = data;
  const bestIdx = recommendation.bestBuildingIndex;

  const toPyung = (m2: number) => (m2 * 0.3025).toFixed(1);

  const requestedWeightsText = meta.requestedWeights ? formatWeightSummary(meta.requestedWeights) : '요청 가중치 없음';

  return (
    <Document>
      {/* 1. 표지 */}
      <Page size="A4" style={styles.coverPage}>
        <Text style={styles.coverTitle}>기업 이전 의사결정 보고서</Text>
        <Text style={styles.coverSub}>Building Relocation Decision Report</Text>
        <View style={{ marginTop: 100 }}>
          <Text style={{ fontSize: 12 }}>생성 일시: {new Date(meta.timestamp).toLocaleString('ko-KR')}</Text>
          <Text style={{ fontSize: 12, marginTop: 5 }}>분석 유형: {meta.type === 'LEASE' ? '임차 비교' : '매매/투자 비교'}</Text>
        </View>
      </Page>

      {/* 2. 요약 및 비교 */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>1. 분석 결과 요약</Text>
        
        <View style={styles.summaryCard}>
          <Text style={styles.recommendationLabel}>AI 추천 최적 대안</Text>
          <Text style={styles.bestBuildingName}>{buildings[bestIdx].name}</Text>
          <Text style={styles.reasonText}>{recommendation.reason}</Text>
        </View>

        <View style={styles.weightSummaryBlock}>
          <Text style={styles.weightSummaryTitle}>가중치 적용 내역</Text>
          <Text style={styles.weightSummaryLine}>요청 가중치: {requestedWeightsText}</Text>
          <Text style={styles.weightSummaryLine}>정규화 가중치: {formatWeightSummary(meta.normalizedWeights)}</Text>
          <Text style={styles.weightSummaryLine}>최종 적용 가중치: {formatWeightSummary(meta.weights)}</Text>
          <Text style={styles.weightSummaryLine}>적용 방식: {getWeightSourceLabel(meta.weightSource)}</Text>
          <Text style={styles.weightSummaryRule}>
            적용 규칙: {meta.weightRuleSummary || WEIGHT_RULE_SUMMARIES[meta.weightSource || 'fallback']}
          </Text>
          <Text style={styles.weightSummaryLine}>요청/정규화/최종 가중치:</Text>
          <View>
            {buildWeightDisplayRows(meta.requestedWeights, meta.normalizedWeights, meta.weights).map((row) => (
              <Text key={row.key} style={styles.weightSupplementRow}>
                {row.label} {row.detail}
                {row.missingInput ? <Text style={styles.missingBadge}> [요청 미입력]</Text> : null}
              </Text>
            ))}
          </View>
          {meta.weightNotice ? <Text style={styles.weightSummaryWarning}>안내: {meta.weightNotice}</Text> : null}
        </View>

        <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>핵심 비교표</Text>
        <View style={styles.table}>
          {/* Header */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLabel}>비교 항목</Text>
            {buildings.map((b, i: number) => (
              <Text key={i} style={styles.tableCellData}>후보 {i + 1}</Text>
            ))}
          </View>
          {/* Data Rows */}
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>건물명</Text>
            {buildings.map((b, i: number) => (
              <Text key={i} style={[styles.tableCellData, i === bestIdx ? { fontWeight: 'bold' } : {}]}>{b.name}</Text>
            ))}
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>월 고정비</Text>
            {buildings.map((b, i: number) => (
              <Text key={i} style={styles.tableCellData}>{formatManwon(b.metrics.cost)}</Text>
            ))}
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>전용면적</Text>
            {buildings.map((b, i: number) => (
              <Text key={i} style={styles.tableCellData}>{toPyung(b.metrics.area)}평</Text>
            ))}
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>인근 시세</Text>
            {buildings.map((b, i: number) => (
              <Text key={i} style={styles.tableCellData}>{formatManwon(toSafeNumber(b.metrics.marketAvgPyung))}/평</Text>
            ))}
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>3년 누적이익</Text>
            {buildings.map((b, i: number) => (
              <Text key={i} style={[styles.tableCellData, i === bestIdx ? styles.bestCell : {}]}>
                {formatSignedBillionFromManwon(b.analysis.cumulativeEffect3Y)}
              </Text>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>© 2026 Building Report Pro - All Rights Reserved</Text>
      </Page>

      {/* 3. 개별 물건 상세 (간소화) */}
      {buildings.map((b, idx: number) => (
        <Page key={idx} size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>후보 {idx + 1}. {b.name} 상세 정보</Text>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, color: '#64748B' }}>주소: {b.address}</Text>
          </View>
          
            <View style={{ flexDirection: 'row', gap: 20 }}>
            <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>물건 요약</Text>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>- 준공연도: {toSafeNumber(b.metrics.year)}년</Text>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>- 연면적: {toSafeNumber(b.metrics.area).toLocaleString()}㎡</Text>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>- 주차대수: {toSafeNumber(b.metrics.parking)}대</Text>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>- 리스크: {b.tags.riskLevel}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10 }}>재무 분석</Text>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>- 월 임대료: {formatManwon(toSafeNumber(b.metrics.cost))}</Text>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>- 월 절감액: {formatSignedManwon(b.analysis.monthlySaving)}</Text>
              <Text style={{ fontSize: 10, marginBottom: 5 }}>
                - 평당 단가: {formatManwon(toSafeNumber(b.metrics.area) > 0 ? (toSafeNumber(b.metrics.cost) / (toSafeNumber(b.metrics.area) * 0.3025)) : 0)}
              </Text>
            </View>
          </View>

          <Text style={styles.footer}>Page {idx + 3} | {b.name}</Text>
        </Page>
      ))}
    </Document>
  );
};
