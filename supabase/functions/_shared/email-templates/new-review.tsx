/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview,
} from "npm:@react-email/components@0.0.22";
import {
  LOGO_URL, main, container, logoSection, logoImg, heroSection, heroEmoji,
  heroTitle, heroSubtitle, cardSection, cardTitle, divider, ctaSection,
  ctaButton, footerDivider, footerSection, footerText, linkStyle, textBody, SITE_URL,
} from "./_styles.ts";

interface Props {
  gmName: string;
  reviewerName: string;
  mesaTitle: string;
  rating: number;
  comment?: string;
  mesaId?: string;
  siteUrl?: string;
}

export function NewReview({
  gmName = "Mestre",
  reviewerName = "Jogador",
  mesaTitle = "Mesa de RPG",
  rating = 5,
  comment = "",
  mesaId = "",
  siteUrl = SITE_URL,
}: Props) {
  const stars = "⭐".repeat(Math.min(5, Math.max(1, rating)));
  return (
    <Html><Head />
      <Preview>Nova avaliação em "{mesaTitle}" — {stars}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="56" height="56" alt="HIVIUM" style={logoImg} />
          </Section>
          <Section style={heroSection}>
            <Text style={heroEmoji}>{stars}</Text>
            <Text style={heroTitle}>Nova avaliação!</Text>
            <Text style={heroSubtitle}>{gmName}, você recebeu uma avaliação de {reviewerName}.</Text>
          </Section>
          <Section style={cardSection}>
            <Text style={cardTitle}>{mesaTitle}</Text>
            <Hr style={divider} />
            <Text style={{ fontSize: "14px", color: "#1a1a2e", margin: "0 0 8px" }}>
              <strong>{rating}/5</strong> — por {reviewerName}
            </Text>
            {comment && (
              <Text style={{ fontSize: "14px", color: "#4b5563", fontStyle: "italic" as const, margin: "8px 0 0" }}>
                "{comment}"
              </Text>
            )}
          </Section>
          <Section style={ctaSection}>
            <Button style={ctaButton} href={mesaId ? `${siteUrl}/mesa/${mesaId}` : `${siteUrl}/dashboard/mestre`}>
              Ver avaliação
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
