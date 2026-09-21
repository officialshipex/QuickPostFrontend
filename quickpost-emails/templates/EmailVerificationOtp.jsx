import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, OtpCode, Notice } from "../components/blocks";

export const subject = "{{OTP}} is your Quickpost verification code";

export default function EmailVerificationOtp({
  firstName = "{{FirstName}}",
  otp = "{{OTP}}",
  expiryMinutes = "10",
}) {
  return (
    <EmailLayout preview={`Your verification code is ${otp}. It expires in ${expiryMinutes} minutes.`} hero={{ file: "hero-otp.png", alt: "Phone with a secure verification code" }}>
      <Heading badge="Verification code" tone="info">Verify your email address</Heading>
      <Greeting name={firstName} />
      <Text>Use the code below to verify your email and activate your Quickpost account.</Text>
      <OtpCode code={otp} />
      <Text muted center>This code expires in {expiryMinutes} minutes.</Text>
      <Notice icon="icon-shield.png">
        Never share this code with anyone. Quickpost will never ask you for it by phone, chat or email.
      </Notice>
      <Text muted style={{ marginBottom: 0 }}>
        Didn't create a Quickpost account? You can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
