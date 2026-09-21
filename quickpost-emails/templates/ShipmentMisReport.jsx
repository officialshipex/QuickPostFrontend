import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, StatGrid, Button } from "../components/blocks";

export const subject = "Daily shipment report – {{ReportDate}}";

export default function ShipmentMisReport({
  firstName = "{{FirstName}}",
  reportDate = "{{ReportDate}}",
  totalShipments = "{{TotalShipments}}",
  pickedUp = "{{PickedUp}}",
  inTransit = "{{InTransit}}",
  delivered = "{{Delivered}}",
  rtoNdr = "{{RtoNdr}}",
  codCollected = "{{CodCollected}}",
  reportLink = "{{ReportLink}}",
}) {
  return (
    <EmailLayout preview={`Your shipment summary for ${reportDate}.`}>
      <div style={{ height: 16 }} />
      <Heading badge={reportDate} tone="success">
        Daily shipment report
      </Heading>
      <Greeting name={firstName} />
      <Text>Here's how your shipments performed today.</Text>
      <StatGrid
        stats={[
          { icon: "stat-total.png", label: "Total shipments", value: totalShipments },
          { icon: "stat-picked-up.png", label: "Picked up", value: pickedUp },
          { icon: "stat-in-transit.png", label: "In transit", value: inTransit },
          { icon: "stat-delivered.png", label: "Delivered", value: delivered, tone: "success" },
          { icon: "stat-rto.png", label: "RTO / NDR", value: rtoNdr, tone: "danger" },
          { icon: "stat-cod.png", label: "COD collected", value: codCollected },
        ]}
      />
      <Button href={reportLink}>View full report</Button>
    </EmailLayout>
  );
}
