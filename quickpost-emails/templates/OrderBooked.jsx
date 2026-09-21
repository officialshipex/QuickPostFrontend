import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, InfoTable, Button, StatusTracker } from "../components/blocks";

export const subject = "Order {{OrderID}} is booked";

export default function OrderBooked({
  firstName = "{{FirstName}}",
  orderId = "{{OrderID}}",
  bookingDate = "{{BookingDate}}",
  pickupDate = "{{PickupDate}}",
  orderLink = "{{OrderLink}}",
}) {
  return (
    <EmailLayout preview={`Your order ${orderId} is booked. Pickup is scheduled for ${pickupDate}.`} hero={{ file: "hero-booked.png", alt: "Clipboard with a checkmark" }}>
      <Heading badge="Order booked" tone="success">You're all set</Heading>
      <StatusTracker current={0} />
      <Greeting name={firstName} />
      <Text>Your order has been booked successfully. We'll pick up your shipment on the scheduled date.</Text>
      <InfoTable
        rows={[
          { label: "Pickup date", value: pickupDate, tone: "success", highlight: true },
          { label: "Order ID", value: orderId, mono: true },
          { label: "Booking date", value: bookingDate },
        ]}
      />
      <Button href={orderLink}>View order</Button>
    </EmailLayout>
  );
}
