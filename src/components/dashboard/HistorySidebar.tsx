'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { FolderOpen, History, Plus, Trash2, Building2 } from "lucide-react";

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  address?: string;
  params?: {
    sigunguCd: string;
    bjdongCd: string;
    bun: string;
    ji: string;
  };
}

interface HistorySidebarProps {
  onSelectItem?: (item: HistoryItem) => void;
  currentId?: string;
}

export function HistorySidebar({ onSelectItem, currentId }: HistorySidebarProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    // 로컬 스토리지에서 데이터 로드
    const saved = localStorage.getItem('building_report_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }

    // storage 이벤트 리스너 (다른 탭에서 변경 시)
    const handleStorage = () => {
      const saved = localStorage.getItem('building_report_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorage);

    // 커스텀 이벤트 리스너 (같은 탭에서 변경 시)
    const handleUpdate = () => {
      const saved = localStorage.getItem('building_report_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    };
    window.addEventListener('historyUpdated', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('historyUpdated', handleUpdate);
    };
  }, []);

  const clearHistory = () => {
    if (confirm('모든 검토 목록을 삭제하시겠습니까?')) {
      localStorage.removeItem('building_report_history');
      setHistory([]);
    }
  };

  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = history.filter(h => h.id !== id);
    localStorage.setItem('building_report_history', JSON.stringify(updated));
    setHistory(updated);
  };

  const handleItemClick = (item: HistoryItem) => {
    if (onSelectItem && item.params) {
      onSelectItem(item);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black flex items-center gap-2 text-zinc-900">
            <History className="w-5 h-5 text-blue-600" />
            검토 목록
          </h2>
          {history.length > 0 && (
            <button onClick={clearHistory} className="text-zinc-400 hover:text-red-500 transition-colors" title="전체 삭제">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-zinc-400">
          검토한 물건을 클릭하면 해당 정보를 다시 불러옵니다.
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {history.length === 0 ? (
          <div className="text-center py-10">
            <FolderOpen className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 font-medium">아직 검토한 물건이 없습니다</p>
            <p className="text-[10px] text-zinc-300 mt-1">주소를 검색하면 자동으로 저장됩니다</p>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              onClick={() => item.params && handleItemClick(item)}
              className={`w-full text-left p-4 rounded-2xl transition-all group border 
                ${currentId === item.id
                  ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20'
                  : 'hover:bg-blue-50 border-transparent hover:border-blue-100'}
                ${!item.params ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg transition-colors ${currentId === item.id ? 'bg-blue-100' : 'bg-zinc-100 group-hover:bg-white'}`}>
                  <Building2 className={`w-4 h-4 ${currentId === item.id ? 'text-blue-600' : 'text-zinc-400 group-hover:text-blue-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold line-clamp-1 ${currentId === item.id ? 'text-blue-700' : 'text-zinc-700 group-hover:text-zinc-900'}`}>
                    {item.title}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono mt-1">{item.date}</p>
                  {item.address && (
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{item.address}</p>
                  )}
                </div>
                <button
                  onClick={(e) => deleteItem(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  title="삭제"
                >
                  <Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-gray-100 bg-zinc-50/50">
        <div className="flex items-center justify-between opacity-50">
          <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Building Report Pro</span>
          <span className="text-[10px] font-mono text-zinc-400">v1.2.1</span>
        </div>
      </div>
    </div>
  );
}