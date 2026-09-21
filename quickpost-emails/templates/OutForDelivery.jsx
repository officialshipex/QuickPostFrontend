import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, InfoTable, Button, StatusTracker, Notice } from "../components/blocks";

export const subject = "Out for delivery: {{ShipmentID}} arrives today";

export default function OutForDelivery({
  firstName = "{{FirstName}}",
  shipmentId = "{{ShipmentID}}",
  trackingId = "{{TrackingID}}",
  expectedDate = "{{ExpectedDate}}",
  trackingLink = "{{TrackingLink}}",
}) {
  return (
    <EmailLayout preview={`Shipment ${shipmentId} is out for delivery and will reach you soon.`} hero={{ file: "hero-out-for-delivery.png", alt: "Quickpost rider on a scooter" }}>
      <Heading badge="Out for delivery" tone="success">Arriving today</Heading>
      <StatusTracker current={2} />
      <Greeting name={firstName} />
      <Text>Your shipment is out for delivery and will reach you soon.</Text>
      <InfoTable
        rows={[
          { label: "Expected delivery", value: expectedDate, tone: "success", highlight: true },
          { label: "Shipment ID", value: shipmentId, mono: true },
          { label: "Tracking ID", value: trackingId, mono: true },
        ]}
      />
      <Notice icon="icon-phone-ring.png">
        Keep your phone nearby. Our delivery partner may call you when they arrive.
      </Notice>
      <Button href={trackingLink}>Track live</Button>
    </EmailLayout>
  );
}
