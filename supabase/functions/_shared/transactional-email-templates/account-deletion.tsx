/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE = 'Sócio do Tabuleiro'

interface Props { name?: string; deletionDate?: string; dataRetentionDays?: string }

const AccountDeletionEmail = ({ name, deletionDate, dataRetentionDays }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirmação de exclusão de conta — {SITE}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Conta excluída com sucesso</Heading>
        <Text style={text}>{name ? `Olá ${name},` : 'Olá,'} confirmamos que sua solicitação de exclusão de conta foi processada conforme previsto na Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</Text>
        {deletionDate && <Text style={text}><strong>Data da exclusão:</strong> {deletionDate}</Text>}
        <Hr style={hr} />
        <Heading style={h2}>O que foi feito:</Heading>
        <Text style={text}>• Seus dados pessoais foram anonimizados ou removidos dos nossos sistemas</Text>
        <Text style={text}>• Suas reservas futuras foram canceladas</Text>
        <Text style={text}>• Seu perfil público foi removido da plataforma</Text>
        <Text style={text}>• Assinaturas ativas foram canceladas</Text>
        <Hr style={hr} />
        <Heading style={h2}>Retenção de dados</Heading>
        <Text style={text}>Conforme a LGPD, alguns dados poderão ser retidos pelo prazo legal de {dataRetentionDays || '5 anos'} exclusivamente para cumprimento de obrigações legais, fiscais e regulatórias (Art. 16, I da LGPD).</Text>
        <Text style={text}>Dados retidos incluem apenas registros de transações financeiras e logs necessários para auditoria fiscal, sem possibilidade de identificação direta.</Text>
        <Hr style={hr} />
        <Text style={text}>Caso tenha dúvidas sobre o tratamento dos seus dados ou deseje exercer outros direitos previstos na LGPD, entre em contato pelo e-mail <strong>privacidade@sociodotabuleiro.app.br</strong>.</Text>
        <Text style={footer}>— Equipe {SITE}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AccountDeletionEmail,
  subject: 'Confirmação de exclusão de conta — LGPD',
  displayName: 'Exclusão de conta (LGPD)',
  previewData: { name: 'João', deletionDate: '15/01/2025', dataRetentionDays: '5 anos' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '480px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 20px' }
const h2 = { fontSize: '18px', fontWeight: 'bold' as const, color: '#2D2338', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#6B6175', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#E8E0EE', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
