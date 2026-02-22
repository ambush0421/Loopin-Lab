import React from 'react';
import { Building2, MapPin, Calculator, TrendingUp, ShieldCheck, CheckCircle2, Store, PieChart, BarChart3, AlertTriangle } from 'lucide-react';
import { CommercialData } from '../dashboard/QuotationModal';
import { CompareGroup } from '@/stores/useCompareStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

export interface PremiumReportTemplateProps {
    compareGroups: CompareGroup[];
    assumptions: {
        leaseDepositPerPy: number;
        leaseRentPerPy: number;
        leaseMaintPerPy: number;
        purchasePricePerPy: number;
        loanLtvUse: number;
        loanLtvInvest: number;
        interestRate: number;
    };
    analyzedGroups: any[]; // We pass down the already calculated groups from QuotationModal
    chartData: any[]; // We pass down the chart data
    customLogo?: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

import { ReportCoverPage } from './ReportCoverPage';
import { ReportExecutiveSummary } from './ReportExecutiveSummary';
import { ReportDetailSheet } from './ReportDetailSheet';

export const PremiumReportTemplate = React.forwardRef<HTMLDivElement, PremiumReportTemplateProps>(
    ({ compareGroups, assumptions, analyzedGroups, chartData, customLogo }, ref) => {
        const currentDate = new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date());

        if (!compareGroups || compareGroups.length === 0) return (
            <div ref={ref} className="hidden print:block bg-white mx-auto p-12 text-center text-slate-500">
                선택된 비교 그룹이 없어 리포트를 생성할 수 없습니다.
            </div>
        );

        return (
            <div ref={ref} className="hidden print:block bg-white mx-auto print-container">
                {/* 1. Cover Page */}
                <ReportCoverPage reportDate={currentDate} totalCandidates={compareGroups.length} customLogo={customLogo} />

                {/* 2. Executive Summary (Replaces Dashboard) */}
                <ReportExecutiveSummary
                    analyzedGroups={analyzedGroups}
                    assumptions={assumptions}
                />

                {/* 3. Detail Sheets */}
                {analyzedGroups.map((group, pageIndex) => (
                    <ReportDetailSheet
                        key={`detail-${group.groupId}`}
                        group={group}
                        pageIndex={pageIndex}
                        assumptions={assumptions}
                    />
                ))}

                <style dangerouslySetInnerHTML={{
                    __html: `
        @media print {
            body * {
                visibility: hidden;
            }
            .print-container, .print-container * {
                visibility: visible;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
                    .print - container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100 %;
                background: white;
            }
                        .page -break-after {
    page -break-after: always;
    break-after: page;
}
@page {
    size: A4 portrait;
    margin: 0;
}
                    }
`}} />

            </div>
        );
    }
);

PremiumReportTemplate.displayName = 'PremiumReportTemplate';
