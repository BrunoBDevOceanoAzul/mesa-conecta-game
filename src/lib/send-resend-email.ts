import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  templateName: string;
  recipientEmail: string;
  templateData?: Record<string, any>;
  idempotencyKey?: string;
}

export async function sendResendEmail(params: SendEmailParams) {
  const { data, error } = await supabase.functions.invoke("send-resend-email", {
    body: params,
  });

  if (error) {
    console.error("Failed to send email via Resend:", error);
    throw error;
  }

  return data;
}
