/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview,
} from "npm:@react-email/components@0.0.22";
import {
  LOGO_URL, main, container, logoSection, logoImg, heroSection, heroEmoji,
  heroTitle, heroSubtitle, cardSection, cardTitle, divider, detailsTable,
  detailLabel, detailValue, ctaSection, ctaButton, footerDivider,
  footerSection, footerText, linkStyle, SITE_URL,
} from "./_styles.ts";

interface Props {
  userName: string;
  description: string;
  amount: string;
  date: string;
  invoiceId?: string;
  siteUrl?: string;
}

export function PaymentReceipt({
  userName = "Usuário",
  description = "Assinatura HIVIUM",
  amount = "R$0,00",
  date = "",
  invoiceId = "",
  siteUrl = SITE_URL,
}: Props) {
  return (
    <Html><Head />
      <Preview>Recibo de pagamento HIVIUM — {amount}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="56" height="56" alt="HIVIUM" style={logoImg} />
          </Section>
          <Section style={heroSection}>
            <Text style={heroEmoji}>🧾</Text>
            <Text style={heroTitle}>Pagamento confirmado</Text>
            <Text style={heroSubtitle}>{userName}, seu pagamento foi processado com sucesso.</Text>
          </Section>
          <Section style={cardSection}>
            <Text style={cardTitle}>Detalhes do pagamento</Text>
            <Hr style={divider} />
            <table style={detailsTable} cellPadding={0} cellSpacing={0}>
              <tr><td style={detailLabel}>Descrição</td><td style={detailValue}>{description}</td></tr>
              <tr><td style={detailLabel}>Valor</td><td style={detailValue}>{amount}</td></tr>
              <tr><td style={detailLabel}>Data</td><td style={detailValue}>{date}</td></tr>
              {invoiceId && <tr><td style={detailLabel}>Referência</td><td style={detailValue}>{invoiceId}</td></tr>}
            </table>
          </Section>
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${siteUrl}/billing`}>Ver minha assinatura</Button>
          </Section>
          <Hr style={footerDivider} />
          <Section style={footerSection}>
            <Text style={footerText}>HIVIUM — A plataforma que conecta sua mesa ao jogador certo.</Text>
            <Text style={{ fontSize: "12px", margin: "0" }}><a href={siteUrl} style={linkStyle}>hivium.app</a></Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
