import EmailVerificationOtp, { subject as otpSubject } from "./templates/EmailVerificationOtp";
import ForgotPassword, { subject as forgotSubject } from "./templates/ForgotPassword";
import NotificationUpdate, { subject as notifSubject } from "./templates/NotificationUpdate";
import ShipmentMisReport, { subject as misSubject } from "./templates/ShipmentMisReport";
import CodRemittance, { subject as codSubject } from "./templates/CodRemittance";
import WeightDiscrepancy, { subject as weightSubject } from "./templates/WeightDiscrepancy";
import NdrShipmentAction, { subject as ndrSubject } from "./templates/NdrShipmentAction";
import OrderBooked, { subject as bookedSubject } from "./templates/OrderBooked";
import OrderShipped, { subject as shippedSubject } from "./templates/OrderShipped";
import OutForDelivery, { subject as ofdSubject } from "./templates/OutForDelivery";
import OrderDelivered, { subject as deliveredSubject } from "./templates/OrderDelivered";

export { renderEmail } from "./render";
export { default as EmailLayout } from "./components/EmailLayout";
export { default as Footer } from "./components/Footer";

export const templates = {
  emailVerificationOtp: { component: EmailVerificationOtp, subject: otpSubject },
  forgotPassword: { component: ForgotPassword, subject: forgotSubject },
  notificationUpdate: { component: NotificationUpdate, subject: notifSubject },
  shipmentMisReport: { component: ShipmentMisReport, subject: misSubject },
  codRemittance: { component: CodRemittance, subject: codSubject },
  weightDiscrepancy: { component: WeightDiscrepancy, subject: weightSubject },
  ndrShipmentAction: { component: NdrShipmentAction, subject: ndrSubject },
  orderBooked: { component: OrderBooked, subject: bookedSubject },
  orderShipped: { component: OrderShipped, subject: shippedSubject },
  outForDelivery: { component: OutForDelivery, subject: ofdSubject },
  orderDelivered: { component: OrderDelivered, subject: deliveredSubject },
};
