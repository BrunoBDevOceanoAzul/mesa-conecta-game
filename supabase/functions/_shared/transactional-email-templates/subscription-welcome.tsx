/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Sócio do Tabuleiro'

interface Props { name?: string; planName?: string }

const SubscriptionWelcomeEmail = ({ name, planName }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Assinatura ativada — {planName || 'Plano Premium'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Assinatura ativada! 🚀</Heading>
        <Text style={text}>{name ? `Olá ${name},` : 'Olá,'} sua assinatura do plano <strong>{planName || 'Premium'}</strong> foi ativada com sucesso!</Text>
        <Text style={text}>Agora você tem acesso a todos os recursos do seu plano. Aproveite!</Text>
        <Text style={footer}>— Equipe {SITE}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SubscriptionWelcomeEmail,
  subject: 'Sua assinatura foi ativada!',
  displayName: 'Boas-vindas de assinatura',
  previewData: { name: 'João', planName: 'Aventureiro Pro' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 24px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
