# CODEBASE.md — BJJ Visits System

> **Última atualização:** 2026-02-20
> **Framework:** React + Vite + TypeScript
> **Backend:** Supabase (Postgres + Realtime + Storage)
> **Testes:** Vitest + React Testing Library + Playwright

---

## Arquitetura de Camadas

```
index.tsx → App.tsx → Pages → Components
                ↓           ↓
              Hooks ← Lib (Services)
                       ↓
                   Supabase API
```

---

## Mapa de Dependências por Arquivo

### Entry Point

| Arquivo | Depende de |
|---|---|
| `index.tsx` | `App.tsx`, `LoadingContext`, `@tanstack/react-query` |
| `App.tsx` | `types`, `hooks/*`, `lib/supabase`, `lib/utils`, `contexts/*`, **todos os Pages**, **todos os Components** |

---

### Lib (Camada de Serviço)

| Arquivo | Depende de | Dependentes |
|---|---|---|
| `lib/supabase-client.ts` | `@supabase/supabase-js` | `lib/supabase.ts` |
| `lib/supabase.ts` | `supabase-client.ts`, `types` | `App.tsx`, todos os hooks, maioria das pages e components |
| `lib/utils.ts` | `clsx`, `tailwind-merge` | `App.tsx`, `VisitDetail`, `SalespersonEvents`, `AdminFinance`, `SalesFinance`, `ConfirmationModal`, `GlobalToast`, `SmartVoiceInput`, `SalesHeader`, `MobileBottomNav`, `visit/*` |
| `lib/business-utils.ts` | `types` | `VendorDetail`, `PublicVoucherLanding`, testes |

---

### Hooks (React Query)

| Hook | Depende de | Dependentes |
|---|---|---|
| `hooks/useAcademies.ts` | `lib/supabase` (DatabaseService) | `App.tsx` |
| `hooks/useEvents.ts` | `lib/supabase` (DatabaseService) | `App.tsx` |
| `hooks/useVisits.ts` | `lib/supabase` (DatabaseService) | `App.tsx` |
| `hooks/useFinance.ts` | `lib/supabase` (DatabaseService) | `App.tsx` |
| `hooks/useVouchers.ts` | `lib/supabase` (DatabaseService) | `App.tsx` |

---

### Contexts

| Context | Depende de | Dependentes |
|---|---|---|
| `contexts/LoadingContext.tsx` | — | `index.tsx`, `App.tsx`, `LoadingOverlay`, `AcademiesManager`, `CallCenterAcademies`, `EventsManager`, `EventDetailAdmin`, `Reports`, `SalespersonEvents`, `UsersManager` |
| `contexts/ElevationContext.tsx` | `lib/supabase` | `App.tsx`, `Navbar` |

---

### Pages

| Página | Depende de |
|---|---|
| `AdminDashboard.tsx` | `types`, `lib/supabase` |
| `AcademiesManager.tsx` | `types`, `lib/supabase`, `LoadingContext` |
| `EventsManager.tsx` | `lib/supabase`, `LoadingContext` |
| `EventDetailAdmin.tsx` | `lib/supabase`, `LoadingContext` |
| `UsersManager.tsx` | `types`, `lib/supabase`, `LoadingContext` |
| `AdminFinance.tsx` | `lib/supabase`, `lib/utils` |
| `Reports.tsx` | `LoadingContext` |
| `SalespersonEvents.tsx` | `types`, `lib/supabase`, `lib/utils`, `LoadingContext`, `ProgressBar`, `VisitDetail` |
| `VisitDetail.tsx` | `lib/supabase`, `lib/utils`, `LoadingContext`, `ProgressBar`, `ConfirmationModal`, `visit/*` (6 subcomponents) |
| `VendorDetail.tsx` | `types`, `lib/business-utils`, `export-to-csv` |
| `VendorList.tsx` | `types` |
| `SalesFinance.tsx` | `types`, `lib/utils` |
| `CallCenterAcademies.tsx` | `types`, `lib/supabase`, `LoadingContext` |
| `CustomAuth.tsx` | `lib/supabase` (AuthService) |
| `Profile.tsx` | `types`, `lib/supabase` |

---

### Components

| Componente | Depende de |
|---|---|
| `Auth.tsx` | `lib/supabase`, `types` |
| `ConfirmationModal.tsx` | `lib/utils` |
| `ElevationPrompt.tsx` | — |
| `GlobalToast.tsx` | `lib/utils` |
| `LoadingOverlay.tsx` | `LoadingContext` |
| `MobileBottomNav.tsx` | `types`, `lib/utils` |
| `Navbar.tsx` | `ElevationContext` |
| `ProgressBar.tsx` | — |
| `PublicVoucherLanding.tsx` | `lib/supabase`, `lib/business-utils` |
| `SalesHeader.tsx` | `types`, `lib/utils` |
| `Sidebar.tsx` | `types`, `package.json` |
| `SmartVoiceInput.tsx` | `lib/utils`, `lib/supabase` |
| `SystemAlerts.tsx` | `types`, `lib/supabase` |
| `AdminModeIndicator.tsx` | — |

#### Visit Subcomponents (`components/visit/`)

| Componente | Depende de |
|---|---|
| `VisitEditModal.tsx` | `types`, `lib/utils` |
| `VisitStepActive.tsx` | `types`, `lib/utils` |
| `VisitStepQrCode.tsx` | `types`, `lib/utils` |
| `VisitStepStart.tsx` | `lib/utils` |
| `VisitStepSummary.tsx` | `types`, `lib/utils` |
| `VisitStepVouchers.tsx` | `types`, `lib/utils` |

---

### Tests

| Arquivo de Teste | Testa |
|---|---|
| `tests/unit/business-utils.test.ts` | `lib/business-utils` (60 testes) |
| `tests/unit/utils.test.ts` | `lib/utils` (13 testes) |
| `tests/unit/database-mapping.test.ts` | `lib/supabase` mapping (9 testes) |
| `tests/unit/supabase-service.test.ts` | `lib/supabase` CRUD |
| `tests/integration/auth.test.ts` | AuthService login/access |
| `tests/integration/error-handling.test.ts` | DatabaseService errors |
| `tests/components/AcademiesManager.test.tsx` | AcademiesManager UI |
| `tests/components/AdminDashboard.test.tsx` | AdminDashboard UI |
| `tests/components/Auth.test.tsx` | Auth component |
| `tests/utils/supabase-test-client.ts` | Mock client (shared) |

---

## Grafo de Impacto (Alto Risco)

> Alterar estes arquivos afeta MUITOS dependentes. Teste antes de commit.

| Arquivo | Dependentes diretos | Risco |
|---|---|---|
| `types.ts` | **~30 arquivos** | 🔴 Crítico |
| `lib/supabase.ts` | **~20 arquivos** | 🔴 Crítico |
| `lib/utils.ts` | **~15 arquivos** | 🟡 Alto |
| `App.tsx` | Entry point, orquestra tudo | 🔴 Crítico |
| `LoadingContext.tsx` | **~10 páginas** | 🟡 Alto |
| `lib/business-utils.ts` | 2 componentes + testes | 🟢 Moderado |

---

## Convenções

- **snake_case → camelCase**: Toda conversão de dados do Supabase acontece em `lib/supabase.ts`
- **Lazy Loading**: Páginas são carregadas via `React.lazy()` em `App.tsx`
- **State Management**: React Query para dados, Context para UI state
- **Testes**: `@tests/utils/supabase-test-client.ts` para mocks compartilhados
