/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps { siteName: string; confirmationUrl: string }
const P = '#7B3FA0'

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu link de login — Sócio do Tabuleiro</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Seu link de acesso 🎯</Heading>
        <Text style={text}>Clique no botão abaixo para entrar no Sócio do Tabuleiro. Este link expira em breve.</Text>
        <Button style={button} href={confirmationUrl}>Entrar</Button>
        <Text style={footer}>Se você não solicitou este link, pode ignorar este e-mail.</Text>
      </Container>
    </Body>
  </Html>
)
export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: P, color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
