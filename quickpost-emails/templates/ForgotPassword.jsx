import React from "react";
import EmailLayout from "../components/EmailLayout";
import { colors } from "../theme";
import { Heading, Greeting, Text, Button, Notice } from "../components/blocks";

export const subject = "Reset your Quickpost password";

export default function ForgotPassword({
  firstName = "{{FirstName}}",
  resetLink = "{{ResetLink}}",
  expiryMinutes = "30",
}) {
  return (
    <EmailLayout preview="We received a request to reset your Quickpost password." hero={{ file: "hero-password.png", alt: "Envelope with a padlock" }}>
      <Heading badge="Password reset" tone="info">Reset your password</Heading>
      <Greeting name={firstName} />
      <Text>
        We received a request to reset the password for your Quickpost account. Choose a new
        password using the button below.
      </Text>
      <Button href={resetLink}>Reset password</Button>
      <div style={{ height: 20 }} />
      <Notice icon="icon-clock.png">
        For your security, this link expires in {expiryMinutes} minutes and can be used only once.
      </Notice>
      <Text muted>
        Didn't request this? Ignore this email and your password will stay the same.
      </Text>
      <Text muted style={{ fontSize: 12, lineHeight: "18px", marginBottom: 0 }}>
        Button not working? Copy this link into your browser:
        <br />
        <a href={resetLink} style={{ color: colors.primary, wordBreak: "break-all" }}>
          {resetLink}
        </a>
      </Text>
    </EmailLayout>
  );
}
