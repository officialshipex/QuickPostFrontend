/**
 * The order id the seller knows the order by, exported as "Customer Order ID" next to our own Order ID:
 * the id they gave on bulk upload / the external API (clientOrderId), else the channel's order name
 * (e.g. Shopify "#VN55038"). Rows built by the backend (passbook, COD, weight discrepancy) and the mapped
 * display rows already carry it as customerOrderId. Same rule as the backend's utils/customerOrderId.js.
 */
export const customerOrderIdOf = (row: any): string =>
  row?.customerOrderId || row?.clientOrderId || row?.channelOrderName || '';

/**
 * The reference shown next to the channel on the order details: the same id, falling back to the raw
 * channelId for older synced orders that have no channelOrderName yet.
 */
export const orderReferenceOf = (order: any): string =>
  customerOrderIdOf(order) || (order?.channelId != null ? String(order.channelId) : '');

/**
 * A quoted CSV cell: quotes escaped, and a text value starting with = + - @ (which Excel would run as a
 * formula) prefixed with a tab, so ids like "@shop-12" open as typed. Numbers (e.g. -50) are left alone.
 */
export const csvCell = (value: unknown): string => {
  const text = String(value ?? '');
  const guarded = typeof value === 'string' && /^[=+\-@]/.test(text) ? `\t${text}` : text;
  return `"${guarded.replace(/"/g, '""')}"`;
};
