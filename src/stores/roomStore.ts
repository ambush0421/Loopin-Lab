import { create } from 'zustand';
import { Room, OccupancyStatus } from '@/types/room';
import { TotalFinancials, LoanSimulation, InvestmentAnalysis } from '@/types/financial';
import { DEFAULT_VACANCY_RATE, DEFAULT_MANAGEMENT_FEE_RATE } from '@/constants';
import {
  calcMonthlyPayment,
  calcNOI,
  calcCapRate,
  calcGrossYield,
  calcLeveragedYield,
  calcDSCR,
  distributeByArea as distributeByAreaUtil,
  calcPricePerPyeong
} from '@/utils/calculate';

interface RoomStoreState {
  allRooms: Room[];
  selectedRooms: Room[];
  totalFinancials: TotalFinancials;
  loanSimulation: LoanSimulation;
  vacancyRate: number;
  managementFeeRate: number;

  setAllRooms: (rooms: Room[]) => void;
  setSelectedRooms: (rooms: Room[]) => void;
  addRoom: (roomId: string) => void;
  removeRoom: (roomId: string) => void;
  addAllRooms: () => void;
  clearSelectedRooms: () => void;

  updateRoomOccupancy: (roomId: string, status: OccupancyStatus) => void;
  updateRoomMemo: (roomId: string, memo: string) => void;
  updateRoomFinancial: (roomId: string, field: 'salePrice' | 'deposit' | 'monthlyRent', value: number) => void;
  setTotalFinancial: (field: 'salePrice' | 'deposit' | 'monthlyRent', value: number) => void;
  distributeByArea: () => void;

  updateLoanSimulation: (field: keyof LoanSimulation, value: number) => void;
  setLoanRatio: (ratio: number) => void;

  setVacancyRate: (rate: number) => void;
  setManagementFeeRate: (rate: number) => void;

  getInvestmentAnalysis: () => InvestmentAnalysis;
  reset: () => void;
}

const initialLoanSimulation: LoanSimulation = {
  loanAmount: 0,
  loanRatio: 60,
  interestRate: 4.5,
  loanTermYears: 20,
  monthlyPayment: 0,
  annualInterest: 0,
  selfFunding: 0,
};

export const useRoomStore = create<RoomStoreState>((set, get) => ({
  allRooms: [],
  selectedRooms: [],
  totalFinancials: { salePrice: 0, deposit: 0, monthlyRent: 0 },
  loanSimulation: initialLoanSimulation,
  vacancyRate: DEFAULT_VACANCY_RATE,
  managementFeeRate: DEFAULT_MANAGEMENT_FEE_RATE,

  setAllRooms: (rooms) => set({ allRooms: rooms }),
  setSelectedRooms: (rooms) => set({ selectedRooms: rooms }),

  addRoom: (roomId) => {
    const { allRooms, selectedRooms } = get();
    if (selectedRooms.find(r => r.id === roomId)) return;

    const room = allRooms.find(r => r.id === roomId);
    if (room) {
      set({ selectedRooms: [...selectedRooms, room] });
    }
  },

  removeRoom: (roomId) => {
    const { selectedRooms } = get();
    set({ selectedRooms: selectedRooms.filter(r => r.id !== roomId) });
  },

  addAllRooms: () => {
    const { allRooms } = get();
    set({ selectedRooms: [...allRooms] });
  },

  clearSelectedRooms: () => set({ selectedRooms: [] }),

  updateRoomOccupancy: (roomId, status) => {
    const { selectedRooms } = get();
    set({
      selectedRooms: selectedRooms.map(r =>
        r.id === roomId ? { ...r, occupancyStatus: status } : r
      )
    });
  },

  updateRoomMemo: (roomId, memo) => {
    const { selectedRooms } = get();
    set({
      selectedRooms: selectedRooms.map(r =>
        r.id === roomId ? { ...r, memo } : r
      )
    });
  },

  updateRoomFinancial: (roomId, field, value) => {
    const { selectedRooms } = get();
    const updatedRooms = selectedRooms.map(r =>
      r.id === roomId ? { ...r, [field]: value } : r
    );

    // 합계 재계산
    const totalFinancials = {
      salePrice: updatedRooms.reduce((sum, r) => sum + r.salePrice, 0),
      deposit: updatedRooms.reduce((sum, r) => sum + r.deposit, 0),
      monthlyRent: updatedRooms.reduce((sum, r) => sum + r.monthlyRent, 0),
    };

    set({ selectedRooms: updatedRooms, totalFinancials });
  },

  setTotalFinancial: (field, value) => {
    set(state => ({
      totalFinancials: { ...state.totalFinancials, [field]: value }
    }));
  },

  distributeByArea: () => {
    const { totalFinancials, selectedRooms } = get();
    if (selectedRooms.length === 0) return;

    const salePrices = distributeByAreaUtil(totalFinancials.salePrice, selectedRooms);
    const deposits = distributeByAreaUtil(totalFinancials.deposit, selectedRooms);
    const monthlyRents = distributeByAreaUtil(totalFinancials.monthlyRent, selectedRooms);

    const updatedRooms = selectedRooms.map((room, i) => ({
      ...room,
      salePrice: salePrices[i],
      deposit: deposits[i],
      monthlyRent: monthlyRents[i],
    }));

    set({ selectedRooms: updatedRooms });
  },

  updateLoanSimulation: (field, value) => {
    const { loanSimulation } = get();
    const updated = { ...loanSimulation, [field]: value };

    // 파생값 자동 계산
    updated.monthlyPayment = calcMonthlyPayment(updated.loanAmount, updated.interestRate, updated.loanTermYears);
    updated.annualInterest = Math.round((updated.loanAmount * updated.interestRate) / 100);

    set({ loanSimulation: updated });
  },

  setLoanRatio: (ratio) => {
    const { totalFinancials, loanSimulation } = get();
    const loanAmount = Math.round((totalFinancials.salePrice * ratio) / 100);
    const selfFunding = totalFinancials.salePrice - loanAmount;

    const updated = {
      ...loanSimulation,
      loanRatio: ratio,
      loanAmount,
      selfFunding
    };

    updated.monthlyPayment = calcMonthlyPayment(updated.loanAmount, updated.interestRate, updated.loanTermYears);
    updated.annualInterest = Math.round((updated.loanAmount * updated.interestRate) / 100);

    set({ loanSimulation: updated });
  },

  setVacancyRate: (rate) => set({ vacancyRate: rate }),
  setManagementFeeRate: (rate) => set({ managementFeeRate: rate }),

  getInvestmentAnalysis: () => {
    const { totalFinancials, selectedRooms, vacancyRate, managementFeeRate, loanSimulation } = get();

    const totalArea = selectedRooms.reduce((sum, r) => sum + r.area, 0);
    const annualGrossIncome = totalFinancials.monthlyRent * 12;
    const vacancyLoss = annualGrossIncome * vacancyRate;
    const effectiveGrossIncome = annualGrossIncome - vacancyLoss;
    const operatingExpense = effectiveGrossIncome * managementFeeRate;
    const noi = effectiveGrossIncome - operatingExpense;

    const annualInterest = loanSimulation.annualInterest;
    const selfFunding = totalFinancials.salePrice - loanSimulation.loanAmount;

    return {
      grossYield: calcGrossYield(totalFinancials.monthlyRent, totalFinancials.salePrice),
      netYield: (noi / totalFinancials.salePrice) * 100,
      annualGrossIncome,
      vacancyLoss,
      effectiveGrossIncome,
      operatingExpense,
      noi,
      capRate: calcCapRate(noi, totalFinancials.salePrice),
      leveragedYield: calcLeveragedYield(noi, annualInterest, selfFunding),
      dscr: calcDSCR(noi, loanSimulation.monthlyPayment * 12),
      pricePerPyeong: calcPricePerPyeong(totalFinancials.salePrice, totalArea),
      rentPerPyeong: calcPricePerPyeong(totalFinancials.monthlyRent, totalArea),
      depositToSaleRatio: totalFinancials.salePrice > 0 ? (totalFinancials.deposit / totalFinancials.salePrice) * 100 : 0,
    };
  },

  reset: () => set({
    allRooms: [],
    selectedRooms: [],
    totalFinancials: { salePrice: 0, deposit: 0, monthlyRent: 0 },
    loanSimulation: initialLoanSimulation,
    vacancyRate: DEFAULT_VACANCY_RATE,
    managementFeeRate: DEFAULT_MANAGEMENT_FEE_RATE,
  }),
}));
