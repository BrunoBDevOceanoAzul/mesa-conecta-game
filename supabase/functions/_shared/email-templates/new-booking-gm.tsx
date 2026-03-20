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
  gmName: string;
  playerName: string;
  mesaTitle: string;
  date: string;
  time: string;
  seatsRemaining: number;
  mesaId?: string;
  siteUrl?: string;
}

export function NewBookingGM({
  gmName = "Mestre",
  playerName = "Jogador",
  mesaTitle = "Mesa de RPG",
  date = "",
  time = "",
  seatsRemaining = 0,
  mesaId = "",
  siteUrl = SITE_URL,
}: Props) {
  return (
    <Html><Head />
      <Preview>Nova reserva em "{mesaTitle}" — {playerName} confirmou!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="56" height="56" alt="HIVIUM" style={logoImg} />
          </Section>
          <Section style={heroSection}>
            <Text style={heroEmoji}>🎉</Text>
            <Text style={heroTitle}>Nova reserva!</Text>
            <Text style={heroSubtitle}>{gmName}, um jogador reservou vaga na sua mesa.</Text>
          </Section>
          <Section style={cardSection}>
            <Text style={cardTitle}>{mesaTitle}</Text>
            <Hr style={divider} />
            <table style={detailsTable} cellPadding={0} cellSpacing={0}>
              <tr><td style={detailLabel}>Jogador</td><td style={detailValue}>{playerName}</td></tr>
              <tr><td style={detailLabel}>Data</td><td style={detailValue}>{date}</td></tr>
              <tr><td style={detailLabel}>Horário</td><td style={detailValue}>{time}</td></tr>
              <tr><td style={detailLabel}>Vagas restantes</td><td style={detailValue}>{seatsRemaining}</td></tr>
            </table>
          </Section>
          <Section style={ctaSection}>
            <Button style={ctaButton} href={mesaId ? `${siteUrl}/mesa/${mesaId}` : `${siteUrl}/dashboard/mestre`}>
              Ver detalhes da mesa
            </Button>
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
