/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview,
} from "npm:@react-email/components@0.0.22";
import {
  LOGO_URL, main, container, logoSection, logoImg, heroSection, heroEmoji,
  heroTitle, heroSubtitle, cardSection, cardTitle, divider, detailsTable,
  detailLabel, detailValue, ctaSection, ctaButton, footerDivider,
  footerSection, footerText, linkStyle, textBody, SITE_URL,
} from "./_styles.ts";

interface Props {
  playerName: string;
  mesaTitle: string;
  gmName: string;
  date: string;
  reason?: string;
  siteUrl?: string;
}

export function BookingCanceled({
  playerName = "Jogador",
  mesaTitle = "Mesa de RPG",
  gmName = "Mestre",
  date = "A definir",
  reason = "",
  siteUrl = SITE_URL,
}: Props) {
  return (
    <Html><Head />
      <Preview>Sua reserva em "{mesaTitle}" foi cancelada</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="56" height="56" alt="HIVIUM" style={logoImg} />
          </Section>
          <Section style={heroSection}>
            <Text style={heroEmoji}>❌</Text>
            <Text style={heroTitle}>Reserva cancelada</Text>
            <Text style={heroSubtitle}>{playerName}, sua reserva foi cancelada.</Text>
          </Section>
          <Section style={cardSection}>
            <Text style={cardTitle}>{mesaTitle}</Text>
            <Hr style={divider} />
            <table style={detailsTable} cellPadding={0} cellSpacing={0}>
              <tr><td style={detailLabel}>Mestre</td><td style={detailValue}>{gmName}</td></tr>
              <tr><td style={detailLabel}>Data</td><td style={detailValue}>{date}</td></tr>
              {reason && <tr><td style={detailLabel}>Motivo</td><td style={detailValue}>{reason}</td></tr>}
            </table>
          </Section>
          {reason && (
            <Section><Text style={textBody}>Se o pagamento já foi efetuado, o reembolso será processado automaticamente.</Text></Section>
          )}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${siteUrl}/explorar`}>Explorar outras mesas</Button>
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
