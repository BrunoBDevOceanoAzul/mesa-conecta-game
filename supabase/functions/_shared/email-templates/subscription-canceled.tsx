/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Html, Head, Body, Container, Section, Text, Button, Img, Hr, Preview,
} from "npm:@react-email/components@0.0.22";
import {
  LOGO_URL, main, container, logoSection, logoImg, heroSection, heroEmoji,
  heroTitle, heroSubtitle, ctaSection, ctaButton, footerDivider,
  footerSection, footerText, linkStyle, textBody, SITE_URL,
} from "./_styles.ts";

interface Props {
  userName: string;
  planName: string;
  endDate: string;
  siteUrl?: string;
}

export function SubscriptionCanceled({
  userName = "Usuário",
  planName = "Pro",
  endDate = "",
  siteUrl = SITE_URL,
}: Props) {
  return (
    <Html><Head />
      <Preview>Sua assinatura {planName} foi cancelada</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="56" height="56" alt="HIVIUM" style={logoImg} />
          </Section>
          <Section style={heroSection}>
            <Text style={heroEmoji}>😢</Text>
            <Text style={heroTitle}>Assinatura cancelada</Text>
            <Text style={heroSubtitle}>{userName}, sentimos muito em ver você partir.</Text>
          </Section>
          <Section>
            <Text style={textBody}>
              Seu plano <strong>{planName}</strong> foi cancelado. Você ainda terá acesso aos recursos premium até <strong>{endDate}</strong>.
            </Text>
            <Text style={textBody}>
              Mudou de ideia? Você pode reativar sua assinatura a qualquer momento.
            </Text>
          </Section>
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${siteUrl}/checkout`}>Reativar assinatura</Button>
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
