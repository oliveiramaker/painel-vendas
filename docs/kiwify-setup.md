# Kiwify + Ecomfy

## 1. Criar o produto

Na Kiwify, crie um produto do tipo **Assinatura recorrente** e adicione o plano mensal do Ecomfy. A Kiwify permite planos mensais, trimestrais, semestrais e anuais.

Sugestão inicial do Ecomfy: **R$ 19,90/mês**.

## 2. Checkout

Depois de criar o produto, copie o link público do checkout e preencha em `billing-config.js`:

```js
window.ECOMFY_BILLING = {
  provider: 'kiwify',
  checkoutUrl: 'COLE_AQUI_O_LINK_DO_CHECKOUT',
  productId: 'ID_DO_PRODUTO',
  monthlyPrice: 19.90,
  annualPrice: 199.00
};
```

Nunca coloque API key, client secret ou token privado nesse arquivo.

## 3. Webhook

No painel Kiwify, abra **Apps → Webhooks → Criar Webhook** e use:

- URL: `https://pupbizieipwnssyotepw.supabase.co/functions/v1/kiwify-webhook`
- Produto: o produto Premium do Ecomfy
- Eventos recomendados: `compra_aprovada`, `subscription_renewed`, `subscription_canceled`, `subscription_late`, `compra_reembolsada` e `chargeback`
- Copie o token de segurança gerado pela Kiwify.

A Kiwify documenta esses eventos de assinatura e permite testar e consultar os logs do webhook.

## 4. Secret do Supabase

Configure no ambiente da Edge Function:

`KIWIFY_WEBHOOK_TOKEN = <token-gerado-pela-kiwify>`

Não coloque esse token no GitHub nem no frontend.

## 5. Como a liberação funciona

- `compra_aprovada` → `profiles.plan = premium`
- `subscription_renewed` → `profiles.plan = premium`
- `subscription_late` → registrado como evento, sem retirar o Premium imediatamente
- `subscription_canceled` → `profiles.plan = free`
- `compra_reembolsada` → `profiles.plan = free`
- `chargeback` → `profiles.plan = free`

A Kiwify informa que cobranças de renovação recusadas passam por novas tentativas durante 5 dias; por isso o Ecomfy não revoga o Premium apenas pelo evento `subscription_late`.

O usuário é localizado pelo e-mail recebido no webhook, comparado ao e-mail salvo em `profiles`.

## 6. Segurança

A Edge Function usa `SUPABASE_SERVICE_ROLE_KEY` somente no ambiente do Supabase para atualizar o plano. Essa chave nunca deve aparecer no código do navegador.

O acesso do usuário à tabela `subscriptions` é protegido por RLS e limitado ao próprio `user_id`.
