import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, AmountDisplay, InfoTable, Button } from "../components/blocks";

export const subject = "COD remittance of {{Amount}} processed";

export default function CodRemittance({
  firstName = "{{FirstName}}",
  remittanceId = "{{RemittanceID}}",
  settlementDate = "{{SettlementDate}}",
  amount = "{{Amount}}",
  bankRefNo = "{{BankRefNo}}",
  remittanceLink = "{{RemittanceLink}}",
}) {
  return (
    <EmailLayout preview={`${amount} has been remitted to your bank account.`} hero={{ file: "hero-cod.png", alt: "Wallet with cash and a checkmark" }}>
      <Heading badge="Remittance processed" tone="success">Cash-on-delivery settled</Heading>
      <Greeting name={firstName} />
      <Text>We've processed your cash-on-delivery remittance. Here are the details.</Text>
      <AmountDisplay label="Amount remitted" value={amount} tone="success" />
      <InfoTable
        rows={[
          { label: "Remittance ID", value: remittanceId, mono: true },
          { label: "Settlement date", value: settlementDate },
          { label: "Bank reference no.", value: bankRefNo, mono: true },
        ]}
      />
      <Text>The amount will be credited to your bank account shortly.</Text>
      <Button href={remittanceLink}>View remittance</Button>
    </EmailLayout>
  );
}
