import React from "react";
import EmailLayout from "../components/EmailLayout";

export const subject = "Quickpost Wishes You A Happy Diwali!";

/* Festive greeting: just the artwork, linking to quickpost.in. The alt text carries the message when images are blocked. */
export default function DiwaliGreeting() {
  return (
    <EmailLayout
      preview="Brighter partnerships. Bigger possibilities. Wishing you and your family a Happy Diwali!"
      footer="none"
      banner={{
        file: "festive-diwali.jpg",
        alt: "Quickpost wishes you a Happy Diwali! Brighter partnerships. Bigger possibilities.",
        href: "https://www.quickpost.in",
      }}
    />
  );
}
