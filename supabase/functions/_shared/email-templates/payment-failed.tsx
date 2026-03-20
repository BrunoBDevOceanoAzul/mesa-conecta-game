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
  amount: string;
  siteUrl?: string;
}

export function PaymentFailed({
  userName = "Usuário",
  planName = "Pro",
  amount = "R$0,00",
  siteUrl = SITE_URL,
}: Props) {
  return (
    <Html><Head />
      <Preview>Falha no pagamento da sua assinatura HIVIUM</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="56" height="56" alt="HIVIUM" style={logoImg} />
          </Section>
          <Section style={heroSection}>
            <Text style={heroEmoji}>⚠️</Text>
            <Text style={heroTitle}>Falha no pagamento</Text>
            <Text style={heroSubtitle}>{userName}, não conseguimos processar o pagamento do plano {planName}.</Text>
          </Section>
          <Section>
            <Text style={textBody}>
              O valor de <strong>{amount}</strong> não pôde ser cobrado. Para evitar a suspensão da sua assinatura, atualize seu método de pagamento.
            </Text>
          </Section>
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`${siteUrl}/billing`}>Atualizar pagamento</Button>
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
