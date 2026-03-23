/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Link, Preview, Text } from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps { siteName: string; email: string; newEmail: string; confirmationUrl: string }
const P = '#7B3FA0'

export const EmailChangeEmail = ({ siteName, email, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração do seu e-mail</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Alteração de e-mail</Heading>
        <Text style={text}>
          Você solicitou alterar seu e-mail no Sócio do Tabuleiro de{' '}
          <Link href={`mailto:${email}`} style={link}>{email}</Link> para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>{newEmail}</Link>.
        </Text>
        <Button style={button} href={confirmationUrl}>Confirmar Alteração</Button>
        <Text style={footer}>Se você não solicitou essa alteração, proteja sua conta imediatamente.</Text>
      </Container>
    </Body>
  </Html>
)
export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 24px' }
const link = { color: P, textDecoration: 'underline' }
const button = { backgroundColor: P, color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
