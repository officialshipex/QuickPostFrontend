import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Turns a template component into a ready-to-send HTML string.
 *   const html = renderEmail(OutForDelivery, { firstName: "Ravi", shipmentId: "QP12345" });
 * Leave props out to keep the {{Placeholders}} for your backend to fill in.
 */
export function renderEmail(Component, props = {}) {
  return "<!DOCTYPE html>" + renderToStaticMarkup(React.createElement(Component, props));
}
