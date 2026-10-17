/* QuickPost Cargo — Pickup Address. Pickup addresses are one list per account shared by both panels
   (same as ShipexFrontend), so Cargo uses the B2C page itself: it shows each address's B2C / Cargo
   primary badges and sets the primary for B2C orders, Cargo (B2B) orders, or both. */
export { AdminPickupAddress as CargoPickupAddress } from '../admin/AdminPickupAddress';
