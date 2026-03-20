/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";

export const LOGO_URL = "https://kcehwcqdoxvkqakdvhsb.supabase.co/storage/v1/object/public/email-assets/hivium-logo.png";
export const SITE_URL = "https://sociodotabuleiro.app.br";
export const SITE_NAME = "HIVIUM";
export const SENDER_DOMAIN = "notify.sociodotabuleiro.app.br";
export const FROM_ADDRESS = `HIVIUM <noreply@${SENDER_DOMAIN}>`;

export const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
};

export const container: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "40px 24px",
};

export const logoSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

export const logoImg: React.CSSProperties = {
  borderRadius: "12px",
};

export const heroSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

export const heroEmoji: React.CSSProperties = {
  fontSize: "40px",
  margin: "0 0 8px",
};

export const heroTitle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: "700",
  color: "#1a1a2e",
  fontFamily: "'Playfair Display', Georgia, serif",
  margin: "0 0 8px",
};

export const heroSubtitle: React.CSSProperties = {
  fontSize: "15px",
  color: "#6b7280",
  margin: "0",
  lineHeight: "1.5",
};

export const cardSection: React.CSSProperties = {
  backgroundColor: "#f8f7ff",
  borderRadius: "16px",
  padding: "24px",
  border: "1px solid #e8e5f0",
  marginBottom: "24px",
};

export const cardTitle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1a1a2e",
  fontFamily: "'Playfair Display', Georgia, serif",
  margin: "0 0 16px",
};

export const divider: React.CSSProperties = {
  borderColor: "#e8e5f0",
  margin: "0 0 16px",
};

export const detailsTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

export const detailLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#9ca3af",
  fontWeight: "500",
  padding: "6px 0",
  verticalAlign: "top",
  width: "120px",
};

export const detailValue: React.CSSProperties = {
  fontSize: "14px",
  color: "#1a1a2e",
  fontWeight: "600",
  padding: "6px 0",
  verticalAlign: "top",
};

export const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

export const ctaButton: React.CSSProperties = {
  backgroundColor: "hsl(272, 60%, 58%)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 32px",
  borderRadius: "12px",
  textDecoration: "none",
  display: "inline-block",
};

export const textBody: React.CSSProperties = {
  fontSize: "15px",
  color: "hsl(280, 10%, 46%)",
  lineHeight: "1.6",
  margin: "0 0 24px",
};

export const footerDivider: React.CSSProperties = {
  borderColor: "#f3f4f6",
};

export const footerSection: React.CSSProperties = {
  textAlign: "center" as const,
  paddingTop: "16px",
};

export const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0 0 4px",
};

export const linkStyle: React.CSSProperties = {
  color: "hsl(272, 60%, 58%)",
  textDecoration: "none",
};
