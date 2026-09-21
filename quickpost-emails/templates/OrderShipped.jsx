import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, InfoTable, Button, StatusTracker } from "../components/blocks";

export const subject = "Your shipment {{ShipmentID}} is on its way";

export default function OrderShipped({
  firstName = "{{FirstName}}",
  shipmentId = "{{ShipmentID}}",
  trackingId = "{{TrackingID}}",
  pickupDate = "{{PickupDate}}",
  trackingLink = "{{TrackingLink}}",
}) {
  return (
    <EmailLayout preview={`Shipment ${shipmentId} has been picked up and is on its way.`} hero={{ file: "hero-shipped.png", alt: "Quickpost delivery truck in motion" }}>
      <Heading badge="Shipped" tone="success">On its way to you</Heading>
      <StatusTracker current={1} />
      <Greeting name={firstName} />
      <Text>Your shipment has been picked up and is moving through our network.</Text>
      <InfoTable
        rows={[
          { label: "Tracking ID", value: trackingId, mono: true, tone: "success", highlight: true },
          { label: "Shipment ID", value: shipmentId, mono: true },
          { label: "Picked up on", value: pickupDate },
        ]}
      />
      <Button href={trackingLink}>Track shipment</Button>
    </EmailLayout>
  );
}
