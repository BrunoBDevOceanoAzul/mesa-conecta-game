/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as welcome } from './welcome.tsx'
import { template as bookingConfirmation } from './booking-confirmation.tsx'
import { template as bookingCanceled } from './booking-canceled.tsx'
import { template as newBookingGm } from './new-booking-gm.tsx'
import { template as contactConfirmation } from './contact-confirmation.tsx'
import { template as subscriptionWelcome } from './subscription-welcome.tsx'
import { template as paymentReceipt } from './payment-receipt.tsx'
import { template as planPurchase } from './plan-purchase.tsx'
import { template as planChange } from './plan-change.tsx'
import { template as accountDeletion } from './account-deletion.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcome,
  'booking-confirmation': bookingConfirmation,
  'booking-canceled': bookingCanceled,
  'new-booking-gm': newBookingGm,
  'contact-confirmation': contactConfirmation,
  'subscription-welcome': subscriptionWelcome,
  'payment-receipt': paymentReceipt,
  'plan-purchase': planPurchase,
  'plan-change': planChange,
  'account-deletion': accountDeletion,
}
