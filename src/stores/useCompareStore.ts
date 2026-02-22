import { create } from 'zustand';

export type ComparisonScenario = 'LEASE' | 'PURCHASE_USE' | 'PURCHASE_INVEST';

export interface CompareUnit {
    _uid: string;
    hoNm: string;
    flrNo: string | number;
    flrGbCd?: string;
    area: any;
    contractArea?: any;
}

export interface CompareGroup {
    groupId: string;
    groupName: string;
    scenario: ComparisonScenario;
    units: CompareUnit[];
    buildingData: any;
    address: string;
    commercialData?: any;
}

interface CompareStore {
    compareGroups: CompareGroup[];
    addGroup: (group: Omit<CompareGroup, 'groupId'>) => void;
    removeGroup: (groupId: string) => void;
    updateGroupScenario: (groupId: string, scenario: ComparisonScenario) => void;
    clearStore: () => void;
    isPaywallOpen: boolean;
    setPaywallOpen: (isOpen: boolean) => void;
    isDashboardOpen: boolean;
    setDashboardOpen: (isOpen: boolean) => void;
}

export const useCompareStore = create<CompareStore>((set) => ({
    compareGroups: [],
    addGroup: (group) => set((state) => {
        if (state.compareGroups.length >= 5) {
            alert("비교함에는 최대 5개의 옵션만 담을 수 있습니다.");
            return state;
        }
        const newGroup = { ...group, groupId: Date.now().toString() };
        return { compareGroups: [...state.compareGroups, newGroup] };
    }),
    removeGroup: (groupId) => set((state) => ({
        compareGroups: state.compareGroups.filter(g => g.groupId !== groupId)
    })),
    updateGroupScenario: (groupId, scenario) => set((state) => ({
        compareGroups: state.compareGroups.map(g =>
            g.groupId === groupId ? { ...g, scenario } : g
        )
    })),
    clearStore: () => set({ compareGroups: [] }),
    isPaywallOpen: false,
    setPaywallOpen: (isOpen) => set({ isPaywallOpen: isOpen }),
    isDashboardOpen: false,
    setDashboardOpen: (isOpen) => set({ isDashboardOpen: isOpen })
}));
