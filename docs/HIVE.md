# Linker Hive - Documentação Técnica

## Visão Geral

O **Linker Hive** é a nova interface principal da Sócio do Tabuleiro, inspirada no conceito de ecossistema hexagonal. Cada hexágono representa uma área do universo do jogador: Network, Clãs, Mercado, Academia, Playground e Radar.

## Arquitetura

```
src/
├── app/hive/
│   └── page.tsx              # Página principal do Hive
├── components/hive/
│   ├── HexagonAgent.tsx      # Componente hexagonal individual
│   ├── LinkerHive.tsx        # Layout hexagonal responsivo
│   └── sections/
│       ├── CommanderProfile.tsx   # Perfil do usuário
│       ├── NetworkContent.tsx     # Conexões
│       ├── MarketContent.tsx      # Mercado de mesas
│       ├── HivesContent.tsx       # Clãs/Grupos
│       ├── AcademyContent.tsx     # Conteúdo educacional
│       ├── PlaygroundContent.tsx  # Ferramentas de jogo
│       └── RadarContent.tsx       # Descoberta
├── context/
│   └── HiveContext.tsx       # Estado global do Hive
└── hooks/hive/               # Hooks específicos do Hive
```

## Design System

### Paleta de Cores
- **Roxo Primário**: `#662583` - Identidade Sócio do Tabuleiro
- **Dourado**: `#F7A731` - Destaques e CTAs
- **Teal**: `#2C8E8B` - Seção Hives
- **Coral**: `#D94367` - Seção Market
- **Fundo**: `#050505` - Tema escuro premium

### Frequências (Hexágonos)
| ID | Label | Cor | Descrição |
|----|-------|-----|-----------|
| user | Comandante | Gradiente roxo/dourado | Perfil do usuário |
| network | Network | Roxo | Conexões profissionais |
| hives | Clã | Teal | Grupos e comunidades |
| academy | Academia | Cyan | Conteúdo educacional |
| market | Mercado | Coral | Mesas e serviços |
| playground | Playground | Âmbar | Ferramentas e jogos |
| radar | Radar | Violeta | Descoberta e exploração |

## Ghost Mode

### Funcionalidade
O Ghost Mode permite ao usuário navegar anonimamente pelo ecossistema. Quando ativado:
- Avatar e nome são ocultados
- Hexágonos ficam em grayscale
- Interações são anônimas

### API
```
PATCH /profiles/me/ghost
Body: { "ghostMode": boolean }
```

## Privacidade por Frequência

### Configurações
O usuário pode controlar a visibilidade de cada área do Hive:
```json
{
  "network": true,
  "hives": true,
  "market": true,
  "academy": true,
  "playground": true,
  "radar": true
}
```

### API
```
PATCH /profiles/me/privacy
Body: { "network": false, "market": true }
```

## Responsividade

### Mobile (< 768px)
- Dock inferior com ícones
- Scroll horizontal para stats
- Cards empilhados verticalmente
- Touch targets >= 44px

### Desktop (>= 768px)
- Layout orbital com hexágonos
- Hexágono central (Comandante)
- Satélites ao redor
- Expansão para dock lateral

## Integração com API Mesa

### Dados do Comandante
```
GET /auth/me
```
Retorna perfil completo com stats de GM e player.

### Ghost Mode
```
PATCH /profiles/me/ghost
```
Atualiza estado anônimo.

### Privacidade
```
PATCH /profiles/me/privacy
```
Atualiza configurações por frequência.

## Estados do Hive

### Modo Home
- Hexágonos em posição orbital
- CommanderProfile visível
- Clique em satélite expande

### Modo Expandido
- Satélites movem-se para dock lateral
- Conteúdo da seção ativa é exibido
- Clique no central volta para home

## Animações

### Framer Motion
- Spring physics para movimentos naturais
- Stagger para hexágonos em sequência
- Layout animations para transições

### Transições
- **Entrada**: fade-in + scale (0.9 → 1)
- **Saída**: fade-out + scale (1 → 0.9)
- **Duração**: 0.3s ease-out

## Performance

### Lazy Loading
Seções são carregadas sob demanda via React.lazy().

### Memoização
HexagonAgent usa React.memo() para evitar re-renders desnecessários.

### Mobile Optimizations
- Scrollbar hidden para touch
- Safe area insets para notch
- Overscroll behavior desabilitado

## Manutenção

### Adicionar Nova Seção
1. Criar componente em `components/hive/sections/`
2. Adicionar ao array HEXAGONS em `page.tsx`
3. Adicionar case no renderContent()
4. Atualizar tipo HiveFrequency se necessário

### Alterar Cores
Modificar o objeto FREQUENCY_COLORS em HexagonAgent.tsx.

### Adicionar Hook
Criar em `hooks/hive/` e exportar via index.ts.

## Testes

```bash
# Type-check
npm run typecheck

# Build
npm run build

# Tests
npm test
```

## Roadmap

- [ ] Integrar dados reais da API (stats, bookings)
- [ ] Implementar busca no Network
- [ ] Criar sistema de Clãs (Hives)
- [ ] Integrar ferramentas do Playground
- [ ] Mapa no Radar
- [ ] Notificações push

## Changelog

### v1.0.0 (2026-04-26)
- Implementação inicial do Linker Hive
- Ghost Mode e privacidade
- Layout responsivo mobile-first
- Integração com API mesa
