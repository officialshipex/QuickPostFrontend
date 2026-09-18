import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, InfoTable, Button, Notice } from "../components/blocks";

export const subject = "Weight discrepancy on shipment {{ShipmentID}}";

export default function WeightDiscrepancy({
  firstName = "{{FirstName}}",
  shipmentId = "{{ShipmentID}}",
  bookedWeight = "{{BookedWeight}}",
  actualWeight = "{{ActualWeight}}",
  difference = "{{Difference}}",
  shipmentLink = "{{ShipmentLink}}",
}) {
  return (
    <EmailLayout preview={`The measured weight of shipment ${shipmentId} differs from the booked weight.`} hero={{ file: "hero-weight.png", alt: "Parcel scale with a warning sign" }}>
      <Heading badge="Weight discrepancy" tone="warning">Charges have been updated</Heading>
      <Greeting name={firstName} />
      <Text>
        The weight measured at our hub doesn't match the weight entered at booking for this shipment.
      </Text>
      <InfoTable
        rows={[
          { label: "Difference", value: difference, tone: "warning", highlight: true },
          { label: "Shipment ID", value: shipmentId, mono: true },
          { label: "Booked weight", value: bookedWeight },
          { label: "Actual weight", value: actualWeight },
        ]}
      />
      <Notice icon="icon-info.png" tone="warning">
        Charges will be updated to the actual weight. If you think this is wrong, raise a dispute
        from the shipment page.
      </Notice>
      <Button href={shipmentLink}>Review shipment</Button>
    </EmailLayout>
  );
}
