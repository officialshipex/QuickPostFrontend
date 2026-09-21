import React from "react";
import EmailLayout from "../components/EmailLayout";
import { brand } from "../theme";
import { Heading, Greeting, Text, InfoTable, Button } from "../components/blocks";

export const subject = "{{NotificationTitle}}";

export default function NotificationUpdate({
  firstName = "{{FirstName}}",
  title = "{{NotificationTitle}}",
  message = "{{NotificationMessage}}",
  dateTime = "{{DateTime}}",
  referenceId = "{{ReferenceID}}",
  details = "{{Details}}",
  dashboardLink = brand.dashboardUrl,
}) {
  return (
    <EmailLayout preview={message} hero={{ file: "hero-notification.png", alt: "Notification bell" }}>
      <Heading badge="Update" tone="info">{title}</Heading>
      <Greeting name={firstName} />
      <Text>{message}</Text>
      <InfoTable
        rows={[
          { icon: "icon-calendar.png", label: "Date & time", value: dateTime },
          { icon: "icon-reference.png", label: "Reference ID", value: referenceId, mono: true },
          { icon: "icon-details.png", label: "Details", value: details },
        ]}
      />
      <Text>Log in to your Quickpost dashboard for the full details.</Text>
      <Button href={dashboardLink}>Go to dashboard</Button>
    </EmailLayout>
  );
}
