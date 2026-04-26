import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { authUsers } from "./auth.js";

// ============================================================
// BILLING PRODUCTS & PLANS
// ============================================================

export const productTypeEnum = pgEnum("product_type", [
  "subscription",
  "credit_package",
  "one_time",
]);

export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "quarterly",
  "yearly",
  "weekly",
  "daily",
]);

export const billingProducts = pgTable("billing_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  productType: productTypeEnum("product_type").default("subscription"),
  targetRole: text("target_role"),
  priceCents: integer("price_cents").default(0),
  currency: text("currency").default("BRL"),
  billingCycle: billingCycleEnum("billing_cycle").default("monthly"),
  featureFlags: jsonb("feature_flags").default(sql`'{}'::jsonb`),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  stripePriceId: text("stripe_price_id"),
  metadataJson: jsonb("metadata_json").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull(),
  role: text("role").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  priceMonthly: integer("price_monthly").default(0),
  currency: text("currency").default("BRL"),
  billingInterval: billingCycleEnum("billing_interval").default("monthly"),
  intervalCount: integer("interval_count").default(1),
  priceAmount: integer("price_amount").default(0),
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(true),
  featureFlags: jsonb("feature_flags").default(sql`'{}'::jsonb`),
  limitsJson: jsonb("limits_json").default(sql`'{}'::jsonb`),
  sortOrder: integer("sort_order").default(0),
  trialDays: integer("trial_days").default(0),
  isFounderPlan: boolean("is_founder_plan").default(false),
  founderSlotsTotal: integer("founder_slots_total").default(0),
  founderSlotsUsed: integer("founder_slots_used").default(0),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// SUBSCRIPTIONS & PAYMENTS
// ============================================================

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "unpaid",
  "trialing",
  "paused",
]);

export const providerEnum = pgEnum("provider", [
  "manual",
  "stripe",
  "asaas",
  "pix",
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "set null" }),
  planName: text("plan_name").notNull(),
  planRole: text("plan_role").notNull(),
  priceCents: integer("price_cents").default(0),
  amount: integer("amount").default(0),
  currency: text("currency").default("BRL"),
  status: subscriptionStatusEnum("status").default("active"),
  billingInterval: billingCycleEnum("billing_interval").default("monthly"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull().defaultNow(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull().default(sql`now() + interval '30 days'`),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  autoRenew: boolean("auto_renew").default(true),
  provider: providerEnum("provider").default("manual"),
  externalSubscriptionId: text("external_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
  "disputed",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "subscription",
  "credit_purchase",
  "one_time",
  "refund",
]);

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  provider: providerEnum("provider").default("manual"),
  externalPaymentId: text("external_payment_id"),
  amount: integer("amount").default(0),
  currency: text("currency").default("BRL"),
  status: paymentStatusEnum("status").default("pending"),
  paymentType: paymentTypeEnum("payment_type").default("subscription"),
  description: text("description"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  metadataJson: jsonb("metadata_json").default(sql`'{}'::jsonb`),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  stripeChargeId: text("stripe_charge_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// WALLETS & CREDITS
// ============================================================

export const walletTypeEnum = pgEnum("wallet_type", [
  "credits",
  "boost",
  "referral",
]);

export const wallets = pgTable("wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  walletType: walletTypeEnum("wallet_type").default("credits"),
  balance: integer("balance").default(0),
  currency: text("currency").default("BRL"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  walletId: uuid("wallet_id").references(() => wallets.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  transactionType: text("transaction_type").notNull(),
  amount: integer("amount").notNull(),
  balanceBefore: integer("balance_before").default(0),
  balanceAfter: integer("balance_after").default(0),
  referenceType: text("reference_type"),
  referenceId: uuid("reference_id"),
  description: text("description"),
  metadataJson: jsonb("metadata_json").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditWallets = pgTable("credit_wallets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  balance: integer("balance").default(0),
  isFounder: boolean("is_founder").default(false),
  founderGrantsUsed: integer("founder_grants_used").default(0),
  founderStartedAt: timestamp("founder_started_at", { withTimezone: true }),
  founderExpiresAt: timestamp("founder_expires_at", { withTimezone: true }),
  freeBoostsPerMonth: integer("free_boosts_per_month").default(0),
  freeBoostsUsedCurrentMonth: integer("free_boosts_used_current_month").default(0),
  lastMonthReset: timestamp("last_month_reset", { withTimezone: true }).defaultNow(),
  founderRank: integer("founder_rank"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  referenceId: uuid("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// COUPONS
// ============================================================

export const discountTypeEnum = pgEnum("discount_type", [
  "percent",
  "fixed_amount",
]);

export const durationTypeEnum = pgEnum("duration_type", [
  "once",
  "repeating",
  "forever",
]);

export const discountCoupons = pgTable("discount_coupons", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdByAdminUserId: uuid("created_by_admin_user_id").references(() => authUsers.id, { onDelete: "set null" }).notNull(),
  internalName: text("internal_name").notNull(),
  publicCode: text("public_code").notNull(),
  stripeCouponId: text("stripe_coupon_id"),
  stripePromotionCodeId: text("stripe_promotion_code_id"),
  discountType: discountTypeEnum("discount_type").default("percent"),
  percentOff: numeric("percent_off"),
  amountOff: integer("amount_off"),
  currency: text("currency").default("BRL"),
  durationType: durationTypeEnum("duration_type").default("once"),
  durationInMonths: integer("duration_in_months"),
  appliesToRolesJson: jsonb("applies_to_roles_json").default(sql`'[]'::jsonb`).notNull(),
  appliesToPlanIdsJson: jsonb("applies_to_plan_ids_json").default(sql`'[]'::jsonb`).notNull(),
  appliesToCreditPackagesJson: jsonb("applies_to_credit_packages_json").default(sql`'[]'::jsonb`).notNull(),
  maxRedemptions: integer("max_redemptions"),
  maxRedemptionsPerUser: integer("max_redemptions_per_user").default(1),
  firstTimeCustomerOnly: boolean("first_time_customer_only").default(false),
  minimumAmount: integer("minimum_amount"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true),
  metadataJson: jsonb("metadata_json").default(sql`'{}'::jsonb`).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const couponRedemptions = pgTable("coupon_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  couponId: uuid("coupon_id").references(() => discountCoupons.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  paymentId: uuid("payment_id").references(() => payments.id, { onDelete: "set null" }),
  stripeDiscountId: text("stripe_discount_id"),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).notNull().defaultNow(),
  discountAmountApplied: integer("discount_amount_applied").default(0),
  currency: text("currency").default("BRL"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// ASAAS ACCOUNTS (Subcontas)
// ============================================================

export const asaasAccountStatusEnum = pgEnum("asaas_account_status", [
  "pending",
  "active",
  "inactive",
  "suspended",
]);

export const asaasAccounts = pgTable("asaas_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull().unique(),
  asaasCustomerId: text("asaas_customer_id").notNull().unique(),
  asaasWalletId: text("asaas_wallet_id"),
  name: text("name"),
  email: text("email"),
  cpfCnpj: text("cpf_cnpj"),
  phone: text("phone"),
  postalCode: text("postal_code"),
  status: asaasAccountStatusEnum("status").default("pending"),
  metadataJson: jsonb("metadata_json").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BillingProduct = typeof billingProducts.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type CreditWallet = typeof creditWallets.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type DiscountCoupon = typeof discountCoupons.$inferSelect;
export type CouponRedemption = typeof couponRedemptions.$inferSelect;
export type AsaasAccount = typeof asaasAccounts.$inferSelect;
