/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Sócio do Tabuleiro'
const P = '#7B3FA0'

interface Props { name?: string; mesaTitle?: string; date?: string; time?: string; gmName?: string }

const BookingConfirmationEmail = ({ name, mesaTitle, date, time, gmName }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Reserva confirmada — {mesaTitle || 'Mesa RPG'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reserva confirmada! 🎲</Heading>
        <Text style={text}>{name ? `Olá ${name},` : 'Olá,'} sua reserva foi confirmada com sucesso!</Text>
        {mesaTitle && <Text style={text}><strong>Mesa:</strong> {mesaTitle}</Text>}
        {gmName && <Text style={text}><strong>Mestre:</strong> {gmName}</Text>}
        {date && <Text style={text}><strong>Data:</strong> {date}{time ? ` às ${time}` : ''}</Text>}
        <Text style={text}>Prepare-se para a aventura! Acesse sua área de jogador para ver os detalhes.</Text>
        <Text style={footer}>— Equipe {SITE}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingConfirmationEmail,
  subject: (data: Record<string, any>) => `Reserva confirmada: ${data?.mesaTitle || 'Mesa RPG'}`,
  displayName: 'Confirmação de reserva',
  previewData: { name: 'João', mesaTitle: 'A Maldição de Strahd', date: '15/01/2025', time: '19:00', gmName: 'Mestre Carlos' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
