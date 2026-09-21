import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, InfoTable, Button, StatusTracker } from "../components/blocks";

export const subject = "Action needed: delivery failed for {{ShipmentID}}";

export default function NdrShipmentAction({
  firstName = "{{FirstName}}",
  shipmentId = "{{ShipmentID}}",
  reason = "{{Reason}}",
  date = "{{Date}}",
  actionLink = "{{ActionLink}}",
}) {
  return (
    <EmailLayout preview={`We couldn't deliver shipment ${shipmentId}. Tell us what to do next.`} hero={{ file: "hero-ndr.png", alt: "Parcel with a red cross" }}>
      <Heading badge="Action required" tone="danger">Delivery attempt failed</Heading>
      <StatusTracker current={2} failed />
      <Greeting name={firstName} />
      <Text>
        We tried to deliver your shipment but couldn't complete it. It's now marked as NDR
        (non-delivery report).
      </Text>
      <InfoTable
        rows={[
          { label: "Reason", value: reason, tone: "danger", highlight: true },
          { label: "Shipment ID", value: shipmentId, mono: true },
          { label: "Attempt date", value: date },
        ]}
      />
      <Text>Choose to reattempt, reschedule or update the delivery details so we can try again.</Text>
      <Button href={actionLink}>Take action</Button>
    </EmailLayout>
  );
}
