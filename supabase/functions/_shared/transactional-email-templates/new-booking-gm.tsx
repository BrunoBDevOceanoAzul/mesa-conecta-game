/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Sócio do Tabuleiro'

interface Props { gmName?: string; mesaTitle?: string; playerName?: string; date?: string }

const NewBookingGmEmail = ({ gmName, mesaTitle, playerName, date }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Nova reserva na sua mesa!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Nova reserva! 🎉</Heading>
        <Text style={text}>{gmName ? `Olá ${gmName},` : 'Olá Mestre,'} um jogador acabou de reservar uma vaga na sua mesa!</Text>
        {mesaTitle && <Text style={text}><strong>Mesa:</strong> {mesaTitle}</Text>}
        {playerName && <Text style={text}><strong>Jogador:</strong> {playerName}</Text>}
        {date && <Text style={text}><strong>Data:</strong> {date}</Text>}
        <Text style={text}>Acesse seu painel de mestre para gerenciar a reserva.</Text>
        <Text style={footer}>— Equipe {SITE}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewBookingGmEmail,
  subject: (data: Record<string, any>) => `Nova reserva: ${data?.mesaTitle || 'sua mesa'}`,
  displayName: 'Notificação de nova reserva (GM)',
  previewData: { gmName: 'Carlos', mesaTitle: 'Aventura D&D 5e', playerName: 'João', date: '15/01/2025' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
