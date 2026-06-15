import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-05-27.dahlia',
})

export const PLAN_PRICES: Record<string, string> = {
  SOLO: process.env.STRIPE_PRICE_SOLO || '',
  CLINIC: process.env.STRIPE_PRICE_CLINIC || '',
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM || '',
}

export async function createTrialSubscription(
  customerEmail: string,
  customerName: string,
  plan: 'SOLO' | 'CLINIC' | 'PREMIUM'
): Promise<{ customerId: string; subscriptionId: string } | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null

  try {
    const customer = await stripe.customers.create({
      email: customerEmail,
      name: customerName,
    })

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: PLAN_PRICES[plan] }],
      trial_period_days: 14,
      payment_behavior: 'default_incomplete',
    })

    return { customerId: customer.id, subscriptionId: subscription.id }
  } catch (err) {
    console.error('Stripe error:', err)
    return null
  }
}

export async function createBillingPortalSession(customerId: string): Promise<string | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/settings`,
    })
    return session.url
  } catch {
    return null
  }
}
