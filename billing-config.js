/* Ecomfy Billing — Mercado Pago.
 * O checkout é criado no servidor pelo Edge Function.
 * Nunca coloque API keys, client secrets ou tokens neste arquivo.
 */
window.ECOMFY_BILLING = window.ECOMFY_BILLING || {
  provider: 'mercadopago',
  checkoutUrl: '',
  productId: '',
  monthlyPrice: 19.90,
  annualPrice: 199.00
};
