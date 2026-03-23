/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Sócio do Tabuleiro'

interface Props { name?: string; amount?: string }

const PaymentReceiptEmail = ({ name, amount }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Comprovante de pagamento</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Pagamento confirmado ✅</Heading>
        <Text style={text}>{name ? `Olá ${name},` : 'Olá,'} seu pagamento{amount ? ` de R$ ${amount}` : ''} foi recebido com sucesso!</Text>
        <Text style={text}>Obrigado por usar o Sócio do Tabuleiro.</Text>
        <Text style={footer}>— Equipe {SITE}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentReceiptEmail,
  subject: 'Pagamento confirmado',
  displayName: 'Comprovante de pagamento',
  previewData: { name: 'João', amount: '35,00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 24px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
