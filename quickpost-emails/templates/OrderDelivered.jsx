import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, InfoTable, Button, StatusTracker } from "../components/blocks";

export const subject = "Delivered: {{ShipmentID}}";

export default function OrderDelivered({
  firstName = "{{FirstName}}",
  shipmentId = "{{ShipmentID}}",
  deliveredDate = "{{DeliveredDate}}",
  receiverName = "{{ReceiverName}}",
  feedbackLink = "{{FeedbackLink}}",
}) {
  return (
    <EmailLayout preview={`Shipment ${shipmentId} was delivered on ${deliveredDate}.`} hero={{ file: "hero-delivered.png", alt: "Delivered parcel with a checkmark" }}>
      <Heading badge="Delivered" tone="success">Your parcel has arrived</Heading>
      <StatusTracker current={3} />
      <Greeting name={firstName} />
      <Text>Your shipment has been delivered successfully. Here's the confirmation.</Text>
      <InfoTable
        rows={[
          { label: "Delivered on", value: deliveredDate, tone: "success", highlight: true },
          { label: "Shipment ID", value: shipmentId, mono: true },
          { label: "Received by", value: receiverName },
        ]}
      />
      <Text>Thank you for choosing Quickpost. Tell us how we did, it takes 10 seconds.</Text>
      <Button href={feedbackLink}>Rate your delivery</Button>
    </EmailLayout>
  );
}
