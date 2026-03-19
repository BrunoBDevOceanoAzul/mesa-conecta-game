
-- Fix all foreign keys that reference game_tables to reference mesas instead

-- 1. bookings.game_table_id -> mesas
ALTER TABLE public.bookings DROP CONSTRAINT bookings_game_table_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_game_table_id_fkey
  FOREIGN KEY (game_table_id) REFERENCES public.mesas(id) ON DELETE CASCADE;

-- 2. conversations.related_table_id -> mesas
ALTER TABLE public.conversations DROP CONSTRAINT conversations_related_table_id_fkey;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_related_table_id_fkey
  FOREIGN KEY (related_table_id) REFERENCES public.mesas(id) ON DELETE SET NULL;

-- 3. chat_analytics.game_table_id -> mesas
ALTER TABLE public.chat_analytics DROP CONSTRAINT chat_analytics_game_table_id_fkey;
ALTER TABLE public.chat_analytics ADD CONSTRAINT chat_analytics_game_table_id_fkey
  FOREIGN KEY (game_table_id) REFERENCES public.mesas(id) ON DELETE SET NULL;

-- 4. feedback_email_queue.game_table_id -> mesas
ALTER TABLE public.feedback_email_queue DROP CONSTRAINT feedback_email_queue_game_table_id_fkey;
ALTER TABLE public.feedback_email_queue ADD CONSTRAINT feedback_email_queue_game_table_id_fkey
  FOREIGN KEY (game_table_id) REFERENCES public.mesas(id) ON DELETE CASCADE;

-- 5. bookings.gm_user_id - remove direct auth.users FK to avoid issues
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_gm_user_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_store_user_id_fkey;
