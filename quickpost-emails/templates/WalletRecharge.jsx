import React from "react";
import EmailLayout from "../components/EmailLayout";
import { Heading, Greeting, Text, AmountDisplay, InfoTable, Button } from "../components/blocks";

export const subject = "Wallet recharge of {{Amount}} successful";

export default function WalletRecharge({
  firstName = "{{FirstName}}",
  paymentId = "{{PaymentID}}",
  transactionId = "{{TransactionID}}",
  dateTime = "{{DateTime}}",
  amount = "{{Amount}}",
  newBalance = "{{NewBalance}}",
  walletLink = "{{WalletLink}}",
}) {
  return (
    <EmailLayout preview={`Your wallet recharge of ${amount} was successful.`} hero={{ file: "hero-cod.png", alt: "Wallet with cash and a checkmark" }}>
      <Heading badge="Recharge successful" tone="success">Wallet recharged successfully</Heading>
      <Greeting name={firstName} />
      <Text>Your payment via Razorpay was successful and your wallet balance has been updated.</Text>
      <AmountDisplay label="Amount added" value={amount} tone="success" />
      <InfoTable
        rows={[
          { label: "Payment ID", value: paymentId, mono: true },
          { label: "Transaction ID", value: transactionId, mono: true },
          { label: "Date & time", value: dateTime },
          { label: "New wallet balance", value: newBalance },
        ]}
      />
      <Text>You can now use your wallet balance to create and process shipments.</Text>
      <Button href={walletLink}>View wallet</Button>
    </EmailLayout>
  );
}
