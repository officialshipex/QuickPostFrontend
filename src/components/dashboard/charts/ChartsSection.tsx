import React from 'react';
import { CouriersSplitChart } from './CouriersSplitChart';
import { PaymentModeChart } from './PaymentModeChart';
import { PerformanceCards } from './PerformanceCards';
import { ShipmentsDistribution } from './ShipmentsDistribution';
import { ShipmentSplitByWeight } from './ShipmentSplitByWeight';
import { DeliveredVsRTO } from './DeliveredVsRTO';

export function ChartsSection() {
  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <CouriersSplitChart />
      <PaymentModeChart />
      <PerformanceCards />
      
      <ShipmentsDistribution />
      <ShipmentSplitByWeight />
      <DeliveredVsRTO />
    </div>
  );
}
