import React, { useState } from 'react';
import { Search, MapPin, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBuildingStore } from '@/stores/buildingStore';
import { useRoomStore } from '@/stores/roomStore';

// Window.daum 타입은 page.tsx의 declare global에서 DaumNamespace로 이미 선언됨
// 여기서는 별도의 인터페이스 없이 전역 타입을 사용

const AddressSearch: React.FC = () => {
  const { fetchBuildingData, address, isLoading, loadingStep, error, reset: resetBuilding } = useBuildingStore();
  const { setAllRooms, reset: resetRooms } = useRoomStore();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Daum Postcode 스크립트 로드
  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSearch = () => {
    if (!scriptLoaded || !window.daum?.Postcode) return;

    new window.daum.Postcode({
      oncomplete: async (data) => {
        const { roadAddress, jibunAddress, bcode, buildingCode } = data;

        try {
          const rooms = await fetchBuildingData(roadAddress, buildingCode, bcode, jibunAddress);
          setAllRooms(rooms);
        } catch (err) {
          console.error(err);
        }
      },
    }).open();
  };

  const handleReset = () => {
    resetBuilding();
    resetRooms();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2 py-4">
        <h1 className="text-3xl font-bold tracking-tight">🏢 Building Report Pro</h1>
        <p className="text-muted-foreground">
          주소 검색 한 번으로 완성되는 고품질 부동산 분석 보고서
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSearch}
          className="flex-1 h-14 text-lg font-semibold shadow-md"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Search className="w-5 h-5 mr-2" />
          )}
          {address ? "다른 주소 검색" : "주소를 검색해주세요"}
        </Button>
        {address && (
          <Button variant="outline" size="icon" className="h-14 w-14" onClick={handleReset}>
            <RotateCcw className="w-5 h-5" />
          </Button>
        )}
      </div>

      {address && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-4">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">{address}</p>
              <p className="text-sm text-muted-foreground">건물 데이터가 성공적으로 로드되었습니다.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in zoom-in duration-300">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="font-medium text-lg">{loadingStep}</p>
          <p className="text-sm text-muted-foreground">잠시만 기다려 주세요...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AddressSearch;
