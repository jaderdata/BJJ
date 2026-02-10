# Plano de Refatoração de Performance Mobile

Este plano visa modularizar o `App.tsx` para reduzir o tamanho do bundle inicial e melhorar a performance em dispositivos móveis, sem alterar a funcionalidade ou o visual.

## ⚠️ Protocolo de Segurança
- Nenhuma alteração será enviada para produção automaticamente.
- Cada etapa deve ser validada localmente (`npm run dev`).
- Backups dos arquivos originais não são necessários pois temos git, mas faremos alterações incrementais.

## Fases do Projeto

### Fase 1: Extração de Componentes Isolados (Concluída)
- [x] Extrair componente `PublicVoucherLanding` para `src/components/PublicVoucherLanding.tsx`
- [x] Extrair componente `EventDetailAdmin` para `src/pages/EventDetailAdmin.tsx`
- [x] Validar funcionamento local.

### Fase 2: Modularização das Views Principais (Concluída)
- [x] Identificar blocos lógicos principais (Admin Dashboard, Lista de Eventos).
- [x] Mover esses blocos para componentes dedicados.
- [x] Manter o gerenciamento de estado no `App.tsx` inicialmente para evitar quebra de fluxo de dados.

### Fase 3: Lazy Loading e Otimização de Rotas (Concluída)
- [x] Implementar `React.lazy` e `Suspense` para carregar os componentes sob demanda.
- [x] Verificar impacto no bundle size.
- [x] Remover aviso de limite de chunk no `vite.config.ts`.

## ✅ Status de Testes (Atualizado)
- [x] Correção de aliases no `vitest.config.ts` e `tsconfig.json`.
- [x] Atualização dos seletores de teste para o idioma português.
- [x] Sucesso em todos os 18 testes automatizados (unitários, integração e componentes).
