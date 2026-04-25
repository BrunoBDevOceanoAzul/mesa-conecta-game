import { sql } from "drizzle-orm";
import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { authUsers } from "./auth.js";
import { mesas } from "./mesas.js";

// Alinhado com o banco remoto Supabase (migrations)
// Nota: ortografia americana 'canceled' conforme banco
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "canceled",
  "completed",
  "refunded",
  "waitlist",
]);

export const bookingPaymentStatusEnum = pgEnum("booking_payment_status", [
  "unpaid",
  "paid",
  "refunded",
  "failed",
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "organic",
  "referral",
  "campaign",
  "boost",
]);

export const bookings = pgTable("bookings", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameTableId: uuid("game_table_id").references(() => mesas.id, { onDelete: "cascade" }).notNull(),
  tableSessionId: uuid("table_session_id"),
  playerUserId: uuid("player_user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  gmUserId: uuid("gm_user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  storeUserId: uuid("store_user_id").references(() => authUsers.id, { onDelete: "set null" }),
  status: bookingStatusEnum("status").default("pending"),
  seatsReserved: integer("seats_reserved").default(1),
  amount: numeric("amount").default("0"),
  currency: text("currency").default("BRL"),
  paymentStatus: bookingPaymentStatusEnum("payment_status").default("unpaid"),
  bookedAt: timestamp("booked_at", { withTimezone: true }).defaultNow(),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  sourceType: sourceTypeEnum("source_type").default("organic"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
});

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "waiting",
  "notified",
  "converted",
  "expired",
]);

export const mesaWaitlist = pgTable("mesa_waitlist", {
  id: uuid("id").defaultRandom().primaryKey(),
  mesaId: uuid("mesa_id").references(() => mesas.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => authUsers.id, { onDelete: "cascade" }).notNull(),
  userEmail: text("user_email"),
  userName: text("user_name"),
  status: waitlistStatusEnum("status").default("waiting"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type MesaWaitlist = typeof mesaWaitlist.$inferSelect;
export type NewMesaWaitlist = typeof mesaWaitlist.$inferInsert;
