/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Sócio do Tabuleiro'
const P = '#7B3FA0'

interface Props { name?: string; planName?: string; amount?: string; billingCycle?: string }

const PlanPurchaseEmail = ({ name, planName, amount, billingCycle }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Plano contratado — {planName || 'Premium'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Plano contratado com sucesso! 🎉</Heading>
        <Text style={text}>{name ? `Olá ${name},` : 'Olá,'} seu plano foi ativado!</Text>
        {planName && <Text style={text}><strong>Plano:</strong> {planName}</Text>}
        {amount && <Text style={text}><strong>Valor:</strong> {amount}{billingCycle ? ` / ${billingCycle}` : ''}</Text>}
        <Hr style={hr} />
        <Text style={text}>Agora você tem acesso a todos os recursos do seu plano. Aproveite ao máximo!</Text>
        <Text style={text}>Caso tenha dúvidas sobre os benefícios inclusos, acesse sua área de assinante na plataforma.</Text>
        <Text style={footer}>— Equipe {SITE}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PlanPurchaseEmail,
  subject: (data: Record<string, any>) => `Plano ${data?.planName || 'Premium'} contratado com sucesso`,
  displayName: 'Compra de plano',
  previewData: { name: 'João', planName: 'Aventureiro Pro', amount: 'R$49,90', billingCycle: 'mês' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#E8E0EE', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
