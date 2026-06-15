import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const status = sub.status
      const customerId = sub.customer as string

      if (status === 'canceled' || status === 'unpaid') {
        await prisma.clinic.updateMany({
          where: { stripeCustomerId: customerId },
          data: { isActive: false },
        })
      }
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      await prisma.clinic.updateMany({
        where: { stripeCustomerId: customerId },
        data: { isActive: true },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
