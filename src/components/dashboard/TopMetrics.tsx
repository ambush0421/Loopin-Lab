'use client';

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp, Building2, AlertCircle,
  Layers, Maximize, Calendar, Car, ArrowUpCircle
} from "lucide-react";

export function TopMetrics({ data }: { data: any }) {
  if (!data) return null;

  // 연차 계산
  const getYears = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === '' || dateStr.length < 4) return "-";
    const year = parseInt(dateStr.substring(0, 4));
    if (isNaN(year)) return "-";
    const currentYear = new Date().getFullYear();
    const diff = currentYear - year;
    return diff <= 0 ? "신축" : `${diff}년차`;
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === '' || dateStr.length < 8) return "-";
    return `${dateStr.substring(0, 4)}.${dateStr.substring(4, 6)}.${dateStr.substring(6, 8)}`;
  };

  // 평수 환산
  const toPyung = (m2: any) => {
    if (!m2) return "0";
    return (Number(m2) * 0.3025).toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  // 주차대수 계산
  const getTotalParkingCnt = () => {
    const indoor = Number(data.indrMechUtcnt || 0) + Number(data.indrAutoUtcnt || 0);
    const outdoor = Number(data.oudrMechUtcnt || 0) + Number(data.oudrAutoUtcnt || 0);
    return indoor + outdoor;
  };

  // 승강기 총 대수
  const getTotalElevCnt = () => {
    return Number(data.rideUseElvtCnt || 0) + Number(data.emgenUseElvtCnt || 0);
  };

  const totalParking = getTotalParkingCnt();
  const totalElev = getTotalElevCnt();
  const hoCnt = Number(data.hhldCnt || data.hoCnt || 0);

  const metrics = [
    {
      label: "규모",
      value: `B${data.ugrndFlrCnt || 0} / ${data.grndFlrCnt || 0}F`,
      subValue: hoCnt > 0 ? `총 ${hoCnt}세대` : "-",
      icon: Layers,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100"
    },
    {
      label: "연면적",
      value: `${Number(data.totArea || 0).toLocaleString()}㎡`,
      subValue: `약 ${toPyung(data.totArea)}평`,
      icon: Maximize,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100"
    },
    {
      label: "사용승인일",
      value: formatDate(data.useAprDay),
      subValue: getYears(data.useAprDay),
      icon: Calendar,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100"
    },
    {
      label: "주차대수",
      value: `${totalParking > 0 ? totalParking : '-'}대`,
      subValue: "등기부 확인 필요",
      icon: Car,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100"
    },
    {
      label: "승강기",
      value: `${totalElev > 0 ? totalElev : '-'}대`,
      subValue: totalElev > 0 ? `승용 ${data.rideUseElvtCnt || 0} / 비상 ${data.emgenUseElvtCnt || 0}` : "-",
      icon: ArrowUpCircle,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100"
    },
    {
      label: "건폐·용적률",
      value: `${data.bcRat || 0}% / ${data.vlRat || 0}%`,
      subValue: "건폐 / 용적",
      icon: TrendingUp,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100"
    },
    {
      label: "주용도",
      value: data.mainPurpsCdNm || "-",
      subValue: data.strctCdNm || "-",
      icon: Building2,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      border: "border-cyan-100"
    },
    {
      label: "위반건축물",
      value: data.vlrtBldRgstYn === '1' ? "⚠ 위반 등재" : "✓ 정상",
      subValue: data.vlrtBldRgstYn === '1' ? "내역 확인 필수" : "적합 상태",
      icon: AlertCircle,
      color: data.vlrtBldRgstYn === '1' ? "text-red-600" : "text-emerald-600",
      bg: data.vlrtBldRgstYn === '1' ? "bg-red-50" : "bg-emerald-50",
      border: data.vlrtBldRgstYn === '1' ? "border-red-200" : "border-emerald-100",
      alert: data.vlrtBldRgstYn === '1'
    }
  ];

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, i) => (
        <Card
          key={i}
          className={`border shadow-sm hover:shadow-lg transition-all duration-200 ${metric.border} ${metric.alert ? "ring-2 ring-red-400 ring-offset-2" : ""
            }`}
        >
          <CardContent className="p-4">
            {/* 아이콘과 레이블 */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
              <span className={`text-xs font-semibold ${metric.alert ? 'text-red-600' : 'text-slate-500'}`}>
                {metric.label}
              </span>
            </div>
            {/* 값 */}
            <div>
              <h3 className={`text-xl font-bold tracking-tight leading-none mb-1.5 ${metric.alert ? 'text-red-700' : 'text-slate-900'
                }`}>
                {metric.value}
              </h3>
              <p className={`text-xs font-medium ${metric.alert ? "text-red-500" : "text-slate-400"}`}>
                {metric.subValue}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}