/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Preview,
} from "npm:@react-email/components@0.0.22";

interface BookingConfirmationProps {
  playerName: string;
  mesaTitle: string;
  gmName: string;
  system: string;
  date: string;
  time: string;
  venue: string;
  format: string;
  price: string;
  mesaUrl: string;
  siteUrl: string;
  logoUrl?: string;
}

export function BookingConfirmation({
  playerName = "Jogador",
  mesaTitle = "Mesa de RPG",
  gmName = "Mestre",
  system = "D&D 5e",
  date = "25/03/2026",
  time = "19h",
  venue = "Online",
  format = "Presencial",
  price = "R$40",
  mesaUrl = "#",
  siteUrl = "https://hivium.app",
  logoUrl,
}: BookingConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Sua vaga em "{mesaTitle}" está confirmada!</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={logoSection}>
              <Img src={logoUrl} width="48" height="48" alt="HIVIUM" style={logo} />
            </Section>
          )}

          <Section style={heroSection}>
            <Text style={heroEmoji}>🎲</Text>
            <Text style={heroTitle}>Vaga confirmada!</Text>
            <Text style={heroSubtitle}>
              {playerName}, sua aventura está prestes a começar.
            </Text>
          </Section>

          <Section style={cardSection}>
            <Text style={cardTitle}>{mesaTitle}</Text>
            <Hr style={divider} />

            <table style={detailsTable} cellPadding={0} cellSpacing={0}>
              <tr>
                <td style={detailLabel}>Mestre</td>
                <td style={detailValue}>{gmName}</td>
              </tr>
              <tr>
                <td style={detailLabel}>Sistema</td>
                <td style={detailValue}>{system}</td>
              </tr>
              <tr>
                <td style={detailLabel}>Data</td>
                <td style={detailValue}>{date}</td>
              </tr>
              <tr>
                <td style={detailLabel}>Horário</td>
                <td style={detailValue}>{time}</td>
              </tr>
              <tr>
                <td style={detailLabel}>Formato</td>
                <td style={detailValue}>{format}</td>
              </tr>
              <tr>
                <td style={detailLabel}>Local</td>
                <td style={detailValue}>{venue}</td>
              </tr>
              <tr>
                <td style={detailLabel}>Investimento</td>
                <td style={detailValue}>{price}</td>
              </tr>
            </table>
          </Section>

          <Section style={ctaSection}>
            <Button style={ctaButton} href={mesaUrl}>
              Ver detalhes da mesa
            </Button>
          </Section>

          <Section style={tipsSection}>
            <Text style={tipsTitle}>Antes da sessão</Text>
            <Text style={tipsText}>
              • Confirme presença com o mestre se houver mudanças{"\n"}
              • Chegue alguns minutos antes do horário{"\n"}
              • Prepare seu personagem (se aplicável)
            </Text>
          </Section>

          <Hr style={footerDivider} />

          <Section style={footerSection}>
            <Text style={footerText}>
              HIVIUM — A plataforma que conecta sua mesa ao jogador certo.
            </Text>
            <Text style={footerLink}>
              <a href={siteUrl} style={linkStyle}>hivium.app</a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ──────────────────────────────────────────

const main: React.CSSProperties = {
  backgroundColor: "#ffffff",
  fontFamily: "'DM Sans', 'Segoe UI', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto",
  padding: "40px 24px",
};

const logoSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const logo: React.CSSProperties = {
  borderRadius: "12px",
};

const heroSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const heroEmoji: React.CSSProperties = {
  fontSize: "40px",
  margin: "0 0 8px",
};

const heroTitle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: "700",
  color: "#1a1a2e",
  fontFamily: "'Playfair Display', Georgia, serif",
  margin: "0 0 8px",
};

const heroSubtitle: React.CSSProperties = {
  fontSize: "15px",
  color: "#6b7280",
  margin: "0",
  lineHeight: "1.5",
};

const cardSection: React.CSSProperties = {
  backgroundColor: "#f8f7ff",
  borderRadius: "16px",
  padding: "24px",
  border: "1px solid #e8e5f0",
  marginBottom: "24px",
};

const cardTitle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#1a1a2e",
  fontFamily: "'Playfair Display', Georgia, serif",
  margin: "0 0 16px",
};

const divider: React.CSSProperties = {
  borderColor: "#e8e5f0",
  margin: "0 0 16px",
};

const detailsTable: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const detailLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#9ca3af",
  fontWeight: "500",
  padding: "6px 0",
  verticalAlign: "top",
  width: "110px",
};

const detailValue: React.CSSProperties = {
  fontSize: "14px",
  color: "#1a1a2e",
  fontWeight: "600",
  padding: "6px 0",
  verticalAlign: "top",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: "hsl(272, 60%, 58%)",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 32px",
  borderRadius: "12px",
  textDecoration: "none",
  display: "inline-block",
};

const tipsSection: React.CSSProperties = {
  backgroundColor: "#fffbf0",
  borderRadius: "12px",
  padding: "20px",
  border: "1px solid #fde68a",
  marginBottom: "32px",
};

const tipsTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "700",
  color: "#92400e",
  margin: "0 0 8px",
};

const tipsText: React.CSSProperties = {
  fontSize: "13px",
  color: "#a16207",
  margin: "0",
  lineHeight: "1.8",
  whiteSpace: "pre-line" as const,
};

const footerDivider: React.CSSProperties = {
  borderColor: "#f3f4f6",
};

const footerSection: React.CSSProperties = {
  textAlign: "center" as const,
  paddingTop: "16px",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0 0 4px",
};

const footerLink: React.CSSProperties = {
  fontSize: "12px",
  margin: "0",
};

const linkStyle: React.CSSProperties = {
  color: "hsl(272, 60%, 58%)",
  textDecoration: "none",
};
