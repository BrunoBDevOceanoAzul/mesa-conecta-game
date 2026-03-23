/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Sócio do Tabuleiro'
const P = '#7B3FA0'

interface Props { name?: string }

const WelcomeEmail = ({ name }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Bem-vindo ao {SITE}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Bem-vindo ao Sócio do Tabuleiro! 🎲</Heading>
        <Text style={text}>{name ? `Olá ${name}!` : 'Olá!'} Sua conta foi criada com sucesso.</Text>
        <Text style={text}>Aqui você encontra mesas de RPG, board games, mestres incríveis e lojas parceiras. Explore a plataforma e comece sua aventura!</Text>
        <Button style={button} href="https://sociodotabuleiro.app.br/explorar">Explorar Mesas</Button>
        <Text style={footer}>— Equipe {SITE}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Bem-vindo ao Sócio do Tabuleiro! 🎲',
  displayName: 'E-mail de boas-vindas',
  previewData: { name: 'João' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 24px' }
const button = { backgroundColor: P, color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
