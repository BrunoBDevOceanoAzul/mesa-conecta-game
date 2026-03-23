/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Sócio do Tabuleiro'

interface Props { name?: string; oldPlanName?: string; newPlanName?: string; effectiveDate?: string }

const PlanChangeEmail = ({ name, oldPlanName, newPlanName, effectiveDate }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu plano foi alterado — {newPlanName || 'Novo plano'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Plano alterado com sucesso 🔄</Heading>
        <Text style={text}>{name ? `Olá ${name},` : 'Olá,'} sua mudança de plano foi processada.</Text>
        {oldPlanName && <Text style={text}><strong>Plano anterior:</strong> {oldPlanName}</Text>}
        {newPlanName && <Text style={text}><strong>Novo plano:</strong> {newPlanName}</Text>}
        {effectiveDate && <Text style={text}><strong>Vigência:</strong> a partir de {effectiveDate}</Text>}
        <Hr style={hr} />
        <Text style={text}>Os novos benefícios já estão disponíveis na sua conta. Caso tenha feito um downgrade, os recursos do plano anterior permanecerão ativos até o final do ciclo vigente.</Text>
        <Text style={footer}>— Equipe {SITE}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PlanChangeEmail,
  subject: (data: Record<string, any>) => `Plano alterado para ${data?.newPlanName || 'novo plano'}`,
  displayName: 'Mudança de plano',
  previewData: { name: 'João', oldPlanName: 'Básico', newPlanName: 'Aventureiro Pro', effectiveDate: '01/02/2025' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#E8E0EE', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
