import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRoomStore } from '@/stores/roomStore';
import { formatArea } from '@/utils/format';

export const RoomSelectionGrid: React.FC = () => {
    const { allRooms, selectedRooms, addRoom, removeRoom, addAllRooms, clearSelectedRooms } = useRoomStore();

    if (allRooms.length === 0) {
        return (
            <Card className="w-full">
                <CardContent className="p-10 text-center text-muted-foreground">
                    불러온 호실 데이터가 없습니다.<br />
                    (데이터 로딩 중이거나 일반건물입니다)
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="text-lg font-bold">호실 선택 (Mock Data 연동 테스트)</CardTitle>
                <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={addAllRooms}>전체 선택</Button>
                    <Button variant="ghost" size="sm" onClick={clearSelectedRooms}>초기화</Button>
                </div>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {allRooms.map((room) => {
                    const isSelected = selectedRooms.some((r) => r.id === room.id);
                    return (
                        <div
                            key={room.id}
                            onClick={() => isSelected ? removeRoom(room.id) : addRoom(room.id)}
                            className={`
                cursor-pointer rounded-lg border p-4 flex flex-col items-center justify-center transition-all
                ${isSelected ? 'border-primary bg-primary/10 shadow-sm' : 'border-border hover:bg-muted/50'}
              `}
                        >
                            <span className="font-bold text-lg mb-1">{room.floor}층 {room.hoNm}</span>
                            <span className="text-sm text-muted-foreground">{room.mainPurpsCdNm}</span>
                            <Badge variant="secondary" className="mt-2">{formatArea(room.area)}</Badge>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
};

export default RoomSelectionGrid;
