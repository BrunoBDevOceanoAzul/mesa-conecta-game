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
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu email no HIVIUM</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://kcehwcqdoxvkqakdvhsb.supabase.co/storage/v1/object/public/email-assets/hivium-logo.png" width="56" height="56" alt="HIVIUM" style={logo} />
        <Heading style={h1}>Confirme seu email 🎲</Heading>
        <Text style={text}>
          Bem-vindo ao{' '}
          <Link href={siteUrl} style={link}>
            <strong>HIVIUM</strong>
          </Link>
          ! Estamos felizes em ter você na comunidade.
        </Text>
        <Text style={text}>
          Confirme seu endereço de email (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) clicando no botão abaixo:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirmar Email
        </Button>
        <Text style={footer}>
          Se você não criou uma conta, pode ignorar este email com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

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
const link = { color: 'hsl(280, 52%, 42%)', textDecoration: 'underline' }
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