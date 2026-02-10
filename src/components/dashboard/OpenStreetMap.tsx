'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface OpenStreetMapProps {
    address: string;
    coords?: { lat: number; lng: number };
    transactions?: any[];
}

export function OpenStreetMap({ address, coords, transactions }: OpenStreetMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // CSS 먼저 로드
        const loadCSS = () => {
            return new Promise<void>((resolve) => {
                if (document.querySelector('link[href*="leaflet.css"]')) {
                    resolve();
                    return;
                }
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                link.onload = () => resolve();
                link.onerror = () => resolve();
                document.head.appendChild(link);
            });
        };

        const initMap = async () => {
            await loadCSS();

            // CSS 적용 대기
            await new Promise(r => setTimeout(r, 100));

            const L = (await import('leaflet')).default;

            // 기본 마커 아이콘 수정
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            if (!mapRef.current) return;

            // 기존 맵 제거
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            const center = coords || { lat: 37.566826, lng: 126.9786567 };

            // 맵 초기화
            const map = L.map(mapRef.current, {
                zoomControl: true,
                attributionControl: true
            }).setView([center.lat, center.lng], 17);

            mapInstanceRef.current = map;

            // OpenStreetMap 타일
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19
            }).addTo(map);

            // 메인 마커
            if (coords) {
                L.marker([coords.lat, coords.lng], {
                    icon: L.divIcon({
                        className: 'custom-marker',
                        html: `
              <div style="
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>
            `,
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                    })
                }).addTo(map).bindPopup(`<b>${address || '선택 위치'}</b>`);
            }

            // 크기 재계산
            setTimeout(() => {
                map.invalidateSize();
                setIsLoading(false);
            }, 200);
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [coords, address, transactions]);

    return (
        <Card className="h-full overflow-hidden flex flex-col border border-slate-200 shadow-lg rounded-2xl relative z-0">
            <CardHeader className="p-3 border-b bg-slate-50">
                <CardTitle className="text-sm font-bold text-slate-600 flex justify-between items-center">
                    <span>📍 건물 위치</span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                        OpenStreetMap
                    </span>
                </CardTitle>
            </CardHeader>
            <div className="flex-1 min-h-[280px] relative" style={{ zIndex: 1 }}>
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                )}
                <div ref={mapRef} className="w-full h-full print:hidden" style={{ minHeight: '280px', position: 'relative', zIndex: 1 }} />
            </div>
        </Card>
    );
}
