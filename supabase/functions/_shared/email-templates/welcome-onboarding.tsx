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
  role: string;
  siteUrl?: string;
}

export function WelcomeOnboarding({
  userName = "Aventureiro",
  role = "player",
  siteUrl = SITE_URL,
}: Props) {
  const roleLabel = role === "gm" ? "Mestre" : role === "store" ? "Luderia" : "Jogador";
  const dashboardUrl =
    role === "gm" ? `${siteUrl}/dashboard/mestre`
    : role === "store" ? `${siteUrl}/dashboard/loja`
    : `${siteUrl}/explorar`;

  return (
    <Html><Head />
      <Preview>Bem-vindo à HIVIUM, {userName}! 🎲</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={LOGO_URL} width="56" height="56" alt="HIVIUM" style={logoImg} />
          </Section>
          <Section style={heroSection}>
            <Text style={heroEmoji}>🎲</Text>
            <Text style={heroTitle}>Bem-vindo à HIVIUM!</Text>
            <Text style={heroSubtitle}>{userName}, seu perfil de {roleLabel} está calibrado. A aventura começa agora.</Text>
          </Section>
          <Section>
            <Text style={textBody}>
              {role === "gm"
                ? "Publique sua primeira mesa, configure sua agenda e comece a receber jogadores pela plataforma. O ecossistema HIVIUM está pronto para potencializar sua operação."
                : role === "store"
                ? "Configure sua luderia, defina seus horários e comece a atrair mestres e jogadores para seu espaço. A HIVIUM conecta você com a comunidade certa."
                : "Explore mesas disponíveis, encontre mestres incríveis e reserve sua vaga na próxima aventura. A comunidade HIVIUM está esperando por você!"}
            </Text>
          </Section>
          <Section style={ctaSection}>
            <Button style={ctaButton} href={dashboardUrl}>
              {role === "gm" ? "Criar minha primeira mesa" : role === "store" ? "Configurar minha luderia" : "Explorar mesas"}
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
