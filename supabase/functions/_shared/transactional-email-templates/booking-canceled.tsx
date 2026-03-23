/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Sócio do Tabuleiro'
const P = '#7B3FA0'

interface Props { name?: string; mesaTitle?: string }

const BookingCanceledEmail = ({ name, mesaTitle }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Reserva cancelada — {mesaTitle || 'Mesa RPG'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reserva cancelada</Heading>
        <Text style={text}>{name ? `Olá ${name},` : 'Olá,'} sua reserva para <strong>{mesaTitle || 'a mesa'}</strong> foi cancelada.</Text>
        <Text style={text}>Se isso foi um engano ou você deseja reagendar, acesse a plataforma para encontrar novas mesas.</Text>
        <Text style={footer}>— Equipe {SITE}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingCanceledEmail,
  subject: 'Reserva cancelada',
  displayName: 'Cancelamento de reserva',
  previewData: { name: 'João', mesaTitle: 'A Maldição de Strahd' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 24px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
