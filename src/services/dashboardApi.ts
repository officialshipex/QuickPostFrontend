export interface DashboardData {
  summary: {
    totalOrders: { value: number; trend: number; isPositive: boolean };
    totalOrdersValue: { value: number; trend: number; isPositive: boolean };
    avgShipCost: { value: number; trend: number; isPositive: boolean };
  };
  actionNeeded: {
    newOrders: number;
    weightDisputes: number;
    shipmentDelays: number;
    pendingPickups: number;
    pendingNDR: number;
    codInitiated: number;
  };
  shipmentsDetails: {
    totalShipments: number;
    pendingPickups: number;
    inTransit: number;
    outForDelivery: number;
    delivered: number;
    unDelivered: number;
    rtoInTransit: number;
  };
  ndrDetails: {
    totalNDR: number;
    actionRequired: number;
    actionRequested: number;
    ndrDelivered: number;
    rtoDelivered: number;
  };
  weightDiscrepancy: {
    totalDiscrepancy: number;
    newDiscrepancy: number;
    acceptedDiscrepancy: number;
    discrepancyRaised: number;
  };
  codStatus: {
    totalCOD: string;
    lastCODRemitted: string;
    codInitiated: string;
    codToBeRemitted: string;
  };
}

const mockDashboardData: DashboardData = {
  summary: {
    totalOrders: { value: 302, trend: 0.8, isPositive: true },
    totalOrdersValue: { value: 23, trend: 0.8, isPositive: false },
    avgShipCost: { value: 202, trend: 0.8, isPositive: true },
  },
  actionNeeded: {
    newOrders: 302,
    weightDisputes: 34,
    shipmentDelays: 111,
    pendingPickups: 14,
    pendingNDR: 34,
    codInitiated: 14,
  },
  shipmentsDetails: {
    totalShipments: 302,
    pendingPickups: 34,
    inTransit: 111,
    outForDelivery: 14,
    delivered: 34,
    unDelivered: 34,
    rtoInTransit: 14,
  },
  ndrDetails: {
    totalNDR: 302,
    actionRequired: 302,
    actionRequested: 302,
    ndrDelivered: 302,
    rtoDelivered: 23,
  },
  weightDiscrepancy: {
    totalDiscrepancy: 302,
    newDiscrepancy: 302,
    acceptedDiscrepancy: 302,
    discrepancyRaised: 302,
  },
  codStatus: {
    totalCOD: "1.24k",
    lastCODRemitted: "1.24k",
    codInitiated: "1.24k",
    codToBeRemitted: "1.24k",
  }
};

export const fetchDashboardData = async (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDashboardData);
    }, 800);
  });
};
