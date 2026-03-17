/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefinir sua senha no HIVIUM</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://kcehwcqdoxvkqakdvhsb.supabase.co/storage/v1/object/public/email-assets/logo.png" width="48" height="48" alt="HIVIUM" style={logo} />
        <Heading style={h1}>Redefinir sua senha</Heading>
        <Text style={text}>
          Recebemos uma solicitação para redefinir sua senha no HIVIUM. Clique no botão abaixo para escolher uma nova senha.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Redefinir Senha
        </Button>
        <Text style={footer}>
          Se você não solicitou a redefinição, pode ignorar este email. Sua senha não será alterada.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const logo = { marginBottom: '24px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: 'hsl(280, 30%, 18%)',
  margin: '0 0 20px',
  fontFamily: "'Playfair Display', Georgia, serif",
}
const text = {
  fontSize: '15px',
  color: 'hsl(280, 10%, 46%)',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const button = {
  backgroundColor: 'hsl(280, 52%, 42%)',
  color: 'hsl(40, 25%, 98%)',
  fontSize: '15px',
  fontWeight: '600' as const,
  borderRadius: '12px',
  padding: '14px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(280, 10%, 60%)', margin: '32px 0 0' }