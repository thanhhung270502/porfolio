# Braintree Full Flow — Next.js + TypeScript

## How it works (high level)

```
Client                          Server (Next.js API)           Braintree
  |                                     |                          |
  |-- GET /api/braintree/token -------> |                          |
  |                                     |-- generate client token ->|
  |                                     |<-- client token ----------|
  |<-- client token ------------------- |                          |
  |                                     |                          |
  | (user enters card via Drop-in UI)   |                          |
  | (Braintree SDK returns nonce)        |                          |
  |                                     |                          |
  |-- POST /api/braintree/checkout ---> |                          |
  |   { nonce, amount }                 |-- transaction.sale() --> |
  |                                     |<-- success/fail ---------|
  |<-- { success, transactionId } ----- |                          |
```

---

## Step 1 — Install dependencies

```bash
npm install braintree
npm install --save-dev @types/braintree
```

For the frontend Drop-in UI:

```bash
npm install braintree-web-drop-in
# or use the React wrapper:
npm install braintree-web-drop-in-react
```

---

## Step 2 — Environment variables

`.env.local`:

```env
BRAINTREE_ENV=sandbox              # or production
BRAINTREE_MERCHANT_ID=bchcx22yj83wwbkj
BRAINTREE_PUBLIC_KEY=8k273hr9mfsk4y59
BRAINTREE_PRIVATE_KEY=your_private_key_here
```

---

## Step 3 — Server-side gateway utility

`lib/braintree.ts`:

```ts
import braintree from 'braintree'

const gateway = new braintree.BraintreeGateway({
  environment:
    process.env.BRAINTREE_ENV === 'production'
      ? braintree.Environment.Production
      : braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID!,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY!,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY!,
})

export default gateway
```

---

## Step 4 — API route: generate client token

`app/api/braintree/token/route.ts`:

```ts
import { NextResponse } from 'next/server'
import gateway from '@/lib/braintree'

export async function GET() {
  const response = await gateway.clientToken.generate({})
  return NextResponse.json({ clientToken: response.clientToken })
}
```

---

## Step 5 — API route: process payment

`app/api/braintree/checkout/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import gateway from '@/lib/braintree'

export async function POST(req: NextRequest) {
  const { nonce, amount }: { nonce: string; amount: string } = await req.json()

  const result = await gateway.transaction.sale({
    amount,
    paymentMethodNonce: nonce,
    options: { submitForSettlement: true },
  })

  if (result.success) {
    return NextResponse.json({
      success: true,
      transactionId: result.transaction.id,
    })
  }

  return NextResponse.json(
    { success: false, message: result.message },
    { status: 400 }
  )
}
```

---

## Step 6 — Frontend checkout component

`components/CheckoutForm.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import DropIn from 'braintree-web-drop-in-react'

export default function CheckoutForm({ amount }: { amount: string }) {
  const [clientToken, setClientToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const instanceRef = useRef<any>(null)

  useEffect(() => {
    fetch('/api/braintree/token')
      .then((r) => r.json())
      .then((data) => setClientToken(data.clientToken))
  }, [])

  const handlePay = async () => {
    if (!instanceRef.current) return
    setLoading(true)

    const { nonce } = await instanceRef.current.requestPaymentMethod()

    const res = await fetch('/api/braintree/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce, amount }),
    })

    const data = await res.json()
    if (data.success) {
      alert(`Payment successful! Transaction: ${data.transactionId}`)
    } else {
      alert(`Payment failed: ${data.message}`)
    }
    setLoading(false)
  }

  if (!clientToken) return <p>Loading payment form...</p>

  return (
    <div>
      <DropIn
        options={{ authorization: clientToken }}
        onInstance={(instance) => (instanceRef.current = instance)}
      />
      <button onClick={handlePay} disabled={loading}>
        {loading ? 'Processing...' : `Pay $${amount}`}
      </button>
    </div>
  )
}
```

---

## Step 7 — Use it on a page

```tsx
import CheckoutForm from '@/components/CheckoutForm'

export default function CheckoutPage() {
  return (
    <main>
      <h1>Checkout</h1>
      <CheckoutForm amount="29.99" />
    </main>
  )
}
```

---

## Key differences from the existing Firebase code

| Existing (Firebase) | New (Next.js) |
|---|---|
| `braintree.connect()` (old API) | `new braintree.BraintreeGateway()` (new API) |
| Secrets via `functions.config()` | Secrets via `process.env` |
| No client token step | Must generate client token for Drop-in UI |
| Raw nonce passed in | Nonce comes from Drop-in SDK |

---

## Optional enhancements

- **Customer vault**: Save payment methods to a `customerId` so returning users don't re-enter card details
- **Webhooks**: Handle `transaction.settled`, `subscription.charged_successfully`, etc. via `/api/braintree/webhook`
- **3D Secure**: Pass `threeDSecure: { required: true }` in Drop-in options for card authentication
- **PayPal**: Add `paypal: { flow: 'checkout' }` to Drop-in options — works out of the box
