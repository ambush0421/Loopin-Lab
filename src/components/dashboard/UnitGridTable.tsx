'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChevronDown, Check, Layers, Search, CheckSquare, Square } from "lucide-react";

interface UnitGridTableProps {
  units: any[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

// 층 정보 파싱 함수 (flrGbCd 코드 기반)
function parseFloor(unit: any): { display: string; sortKey: number; isBasement: boolean; isRooftop: boolean } {
  const flrNo = Number(unit.flrNo) || 0;
  const flrGbCd = unit.flrGbCd;

  const isBasement = flrGbCd === "10";
  const isRooftop = flrGbCd === "30";
  const isPiloti = flrGbCd === "40";

  if (isBasement) {
    const basementLevel = flrNo > 0 ? flrNo : 1;
    return { display: `B${basementLevel}`, sortKey: -basementLevel, isBasement: true, isRooftop: false };
  } else if (isRooftop) {
    return { display: `R${flrNo > 0 ? flrNo : ''}`, sortKey: 1000 + flrNo, isBasement: false, isRooftop: true };
  } else if (isPiloti) {
    return { display: `P${flrNo > 0 ? flrNo : ''}`, sortKey: 0, isBasement: false, isRooftop: false };
  } else {
    return { display: flrNo > 0 ? `${flrNo}F` : '-', sortKey: flrNo, isBasement: false, isRooftop: false };
  }
}

export function UnitGridTable({ units, selectedIds, onSelectionChange }: UnitGridTableProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [isFloorDropdownOpen, setIsFloorDropdownOpen] = useState(false);

  // 전유 면적만 필터링 (page.tsx에서 이미 _uid가 부여된 상태로 전달됨)
  // 중복 제거는 _uid 기준으로 수행
  const uniqueUnits = useMemo(() => {
    const privateUnits = units.filter(u =>
      u.exposPubuseGbCd === "1" || u.exposPubuseGbCdNm === "전유"
    );

    // _uid가 이미 부여된 경우 그대로 사용, 아니면 fallback으로 생성
    const uniqueUnitsMap = new Map<string, any>();
    privateUnits.forEach((u, idx) => {
      // page.tsx에서 생성된 _uid를 그대로 사용
      const key = u._uid || `fallback-${idx}`;
      if (!uniqueUnitsMap.has(key)) {
        uniqueUnitsMap.set(key, { ...u, _uid: key });
      }
    });
    return Array.from(uniqueUnitsMap.values());
  }, [units]);

  // 층 목록 추출
  const floorList = useMemo(() => {
    const floors = new Map<string, { display: string; sortKey: number; count: number }>();

    uniqueUnits.forEach(u => {
      const floorInfo = parseFloor(u);
      const key = floorInfo.display;

      if (key !== '-') {
        if (floors.has(key)) {
          floors.get(key)!.count++;
        } else {
          floors.set(key, { display: key, sortKey: floorInfo.sortKey, count: 1 });
        }
      }
    });

    return Array.from(floors.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [uniqueUnits]);

  // 필터링 및 정렬
  const sortedUnits = useMemo(() => {
    let filtered = uniqueUnits;

    if (floorFilter !== 'all') {
      filtered = filtered.filter(u => parseFloor(u).display === floorFilter);
    }

    if (searchFilter) {
      filtered = filtered.filter(u => {
        const floorInfo = parseFloor(u);
        const hoStr = String(u.hoNm || '');
        return `${floorInfo.display} ${hoStr}`.toLowerCase().includes(searchFilter.toLowerCase());
      });
    }

    return filtered.sort((a, b) => {
      const floorA = parseFloor(a);
      const floorB = parseFloor(b);

      if (floorA.sortKey !== floorB.sortKey) return floorA.sortKey - floorB.sortKey;

      const parseHoNum = (ho: string | undefined) => {
        if (!ho) return 0;
        const match = ho.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      };

      return parseHoNum(a.hoNm) - parseHoNum(b.hoNm);
    });
  }, [uniqueUnits, floorFilter, searchFilter]);

  const toggleUnit = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      if (newSelection.size >= 100) {
        alert('최대 100개 호실까지만 선택 가능합니다.');
        return;
      }
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const toggleFloor = (floorDisplay: string) => {
    const floorUnits = sortedUnits.filter(u => parseFloor(u).display === floorDisplay);
    const floorIds = floorUnits.map(u => u._uid);
    const allSelected = floorIds.every(id => selectedIds.has(id));

    const newSelection = new Set(selectedIds);
    floorIds.forEach(id => {
      if (allSelected) newSelection.delete(id);
      else if (newSelection.size < 100) newSelection.add(id);
    });
    onSelectionChange(newSelection);
  };

  const selectAllFiltered = () => {
    const filteredIds = sortedUnits.map(u => u._uid);
    const allSelected = filteredIds.every(id => selectedIds.has(id));

    const newSelection = new Set(selectedIds);
    filteredIds.forEach(id => {
      if (allSelected) newSelection.delete(id);
      else if (newSelection.size < 100) newSelection.add(id);
    });
    onSelectionChange(newSelection);
  };

  // 선택된 호실 수
  const selectedInView = sortedUnits.filter(u => selectedIds.has(u._uid)).length;
  const allSelected = sortedUnits.length > 0 && sortedUnits.every(u => selectedIds.has(u._uid));

  return (
    <Card className="h-full flex flex-col border border-slate-200 shadow-lg overflow-hidden rounded-2xl">
      {/* 헤더 */}
      <CardHeader className="bg-slate-50 border-b border-slate-100 px-5 py-4">
        <div className="flex flex-col gap-3">
          {/* 타이틀 */}
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
              <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
              호실별 전유면적
            </CardTitle>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">
                {sortedUnits.length}개 호실
              </span>
              {selectedInView > 0 && (
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  {selectedInView}개 선택
                </span>
              )}
            </div>
          </div>

          {/* 필터 영역 */}
          <div className="flex gap-2 flex-wrap">
            {/* 층 필터 */}
            <div className="relative">
              <button
                onClick={() => setIsFloorDropdownOpen(!isFloorDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span className="text-slate-700">{floorFilter === 'all' ? '전체 층' : floorFilter}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFloorDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFloorDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-auto">
                  <button
                    onClick={() => { setFloorFilter('all'); setIsFloorDropdownOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-slate-50 ${floorFilter === 'all' ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                  >
                    전체 층 ({uniqueUnits.length}개)
                    {floorFilter === 'all' && <Check className="w-4 h-4" />}
                  </button>
                  <div className="border-t border-slate-100"></div>

                  {/* 지하층 */}
                  {floorList.filter(f => f.sortKey < 0).length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-xs font-bold text-amber-600 bg-amber-50">지하층</div>
                      {floorList.filter(f => f.sortKey < 0).map(floor => (
                        <button
                          key={floor.display}
                          onClick={() => { setFloorFilter(floor.display); setIsFloorDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-slate-50 ${floorFilter === floor.display ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            {floor.display}
                          </span>
                          <span className="text-slate-400">({floor.count}개)</span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* 지상층 */}
                  <div className="px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50">지상층</div>
                  {floorList.filter(f => f.sortKey > 0 && f.sortKey < 1000).map(floor => (
                    <button
                      key={floor.display}
                      onClick={() => { setFloorFilter(floor.display); setIsFloorDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-slate-50 ${floorFilter === floor.display ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        {floor.display}
                      </span>
                      <span className="text-slate-400">({floor.count}개)</span>
                    </button>
                  ))}

                  {/* 옥탑층 */}
                  {floorList.filter(f => f.sortKey >= 1000).length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-xs font-bold text-purple-600 bg-purple-50">옥탑층</div>
                      {floorList.filter(f => f.sortKey >= 1000).map(floor => (
                        <button
                          key={floor.display}
                          onClick={() => { setFloorFilter(floor.display); setIsFloorDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium hover:bg-slate-50 ${floorFilter === floor.display ? 'text-blue-600 bg-blue-50' : 'text-slate-700'}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            {floor.display}
                          </span>
                          <span className="text-slate-400">({floor.count}개)</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 검색 */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="호수 검색..."
                className="w-full text-sm pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>

            {/* 전체 선택 */}
            <button
              onClick={selectAllFiltered}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${allSelected
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400 hover:shadow-sm'
                }`}
            >
              {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
          </div>
        </div>
      </CardHeader>

      {/* 테이블 */}
      <CardContent className="flex-1 overflow-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
            <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3 w-12 text-center">선택</th>
              <th className="px-4 py-3 w-20">층</th>
              <th className="px-4 py-3">호수</th>
              <th className="px-4 py-3">전용면적</th>
              <th className="px-4 py-3">용도</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedUnits.map((unit, index) => {
              const floorInfo = parseFloor(unit);
              const ho = unit.hoNm || `${index}`;
              const area = Number(unit.area || 0);
              const unitId = unit._uid;
              const isSelected = selectedIds.has(unitId);

              if (!unitId) return null;

              return (
                <tr
                  key={`unit-${unitId}`}
                  className={`group cursor-pointer transition-all ${isSelected
                    ? 'bg-blue-50 hover:bg-blue-100'
                    : 'hover:bg-slate-50'
                    }`}
                  onClick={() => toggleUnit(unitId)}
                >
                  {/* 체크박스 */}
                  <td className="px-5 py-3 text-center">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-300 group-hover:border-blue-400'
                      }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </td>

                  {/* 층 */}
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFloor(floorInfo.display); }}
                      className={`text-sm font-bold px-2 py-0.5 rounded-md transition-colors ${floorInfo.isBasement
                        ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                        : floorInfo.isRooftop
                          ? 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                          : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                        }`}
                    >
                      {floorInfo.display}
                    </button>
                  </td>

                  {/* 호수 */}
                  <td className="px-4 py-3">
                    <span className="text-base font-bold text-slate-900">{ho}</span>
                  </td>

                  {/* 전용면적 */}
                  <td className="px-4 py-3">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-slate-900">{(area * 0.3025).toFixed(1)}</span>
                      <span className="text-sm text-slate-500">평</span>
                      <span className="text-xs text-slate-400">({area.toFixed(2)}㎡)</span>
                    </div>
                  </td>

                  {/* 용도 */}
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md">
                      {unit.mainPurpsCdNm || unit.etcPurps || '일반'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 빈 상태 */}
        {sortedUnits.length === 0 && (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <p className="text-sm">조건에 맞는 호실이 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}