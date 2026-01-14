# Sistema de Design - BJJ Visits

Este documento descreve os princípios e componentes do sistema de design aplicado em toda a aplicação.

## 🎨 Princípios de Design

### 1. Glassmorphism
Todos os cards e containers usam efeito de vidro:
```tsx
className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10"
```

### 2. Gradientes Vibrantes
Headers e elementos de destaque usam gradientes HSL:
```tsx
// Primary gradient (Purple)
className="bg-gradient-to-br from-[hsl(262,83%,58%)] via-[hsl(262,83%,48%)] to-[hsl(262,83%,38%)]"

// Outros gradientes
- Purple/Pink: from-purple-500 to-pink-500
- Blue/Cyan: from-blue-500 to-cyan-500
- Emerald/Teal: from-emerald-500 to-teal-500
- Amber/Orange: from-amber-500 to-orange-500
```

### 3. Micro-animações
Todos os elementos interativos têm animações suaves:
```tsx
// Hover lift
className="hover:-translate-y-2 transition-all duration-500"

// Glow effect
className="opacity-0 group-hover:opacity-100 transition-opacity duration-500"

// Scale
className="group-hover:scale-110 transition-transform duration-300"
```

### 4. Tipografia
Hierarquia clara com fonte Inter:
```tsx
// H1 - Títulos principais
className="text-xl md:text-2xl font-black text-white tracking-tight"

// H2 - Subtítulos
className="text-lg font-black text-white"

// Body - Texto normal
className="text-sm text-white/80 font-medium"

// Labels - Pequenos textos
className="text-xs font-bold text-white/60 uppercase tracking-wider"
```

### 5. Espaçamento Compacto
Layout otimizado para densidade de informação:
```tsx
// Container principal
className="space-y-6 p-4"

// Cards
className="p-4 gap-4"

// Grids
className="grid gap-4"
```

## 📐 Estrutura de Componentes

### Header Pattern
```tsx
<div className="relative overflow-hidden bg-gradient-to-br from-[hsl(262,83%,58%)] via-[hsl(262,83%,48%)] to-[hsl(262,83%,38%)] p-6 rounded-2xl shadow-2xl">
  {/* Glassmorphism overlay */}
  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
  
  {/* Decorative elements */}
  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
  
  <div className="relative z-10">
    <h1 className="text-xl md:text-2xl font-black text-white mb-1">Título</h1>
    <p className="text-white/80 text-sm font-medium">Descrição</p>
  </div>
</div>
```

### KPI Card Pattern
```tsx
<div className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
  {/* Glow effect */}
  <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  
  <div className="relative z-10">
    {/* Icon */}
    <div className="inline-flex p-2 rounded-xl bg-purple-500/20 text-purple-400 mb-2">
      <Icon size={18} strokeWidth={2} />
    </div>
    
    {/* Value */}
    <h3 className="text-2xl font-black text-white mb-1">123</h3>
    <p className="text-xs font-bold text-white/60 uppercase">Label</p>
  </div>
</div>
```

### Table Pattern
```tsx
<div className="relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
  {/* Header */}
  <div className="p-4 border-b border-white/10 flex items-center space-x-2">
    <div className="p-1.5 bg-purple-500/20 rounded-lg">
      <Icon size={16} className="text-purple-400" />
    </div>
    <h3 className="text-lg font-black text-white">Título</h3>
  </div>
  
  {/* Table */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-white/5 border-b border-white/10">
        <tr>
          <th className="px-4 py-3 text-xs font-black text-white/60 uppercase">Coluna</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        <tr className="hover:bg-white/5 transition-colors">
          <td className="px-4 py-3 text-sm text-white/80">Conteúdo</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Form Input Pattern
```tsx
<input
  type="text"
  className="w-full px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-sm font-medium"
  placeholder="Placeholder..."
/>
```

### Button Pattern
```tsx
{/* Primary Button */}
<button className="bg-white/10 backdrop-blur-md border-2 border-white/20 text-white px-4 py-2 rounded-xl font-bold hover:bg-white/20 transition-all">
  Ação
</button>

{/* Success Button */}
<button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/50">
  Salvar
</button>
```

## 🎯 Cores por Categoria

### Status
- **Ativo/Sucesso**: Emerald/Teal gradient
- **Pendente/Aviso**: Amber/Orange gradient  
- **Erro/Crítico**: Red/Orange gradient
- **Neutro/Info**: Blue/Cyan gradient

### Elementos
- **Primary**: Purple gradient (headers, principais)
- **Cards**: Glassmorphism com white/5 to white/[0.02]
- **Borders**: white/10 (padrão), white/20 (hover)
- **Text**: white (títulos), white/80 (corpo), white/60 (labels)

## 📱 Responsividade

Sempre usar abordagem mobile-first:
```tsx
// Mobile: 1 coluna
// Tablet: 2 colunas  
// Desktop: 4 colunas
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"

// Texto responsivo
className="text-xl md:text-2xl"
```

## ✨ Efeitos Especiais

### Decorative Blurs
```tsx
<div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
```

### Glow on Hover
```tsx
<div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
```

### Icon Animation
```tsx
<div className="group-hover:scale-110 transition-transform duration-300">
  <Icon />
</div>
```

## 🔧 Uso dos Design Tokens

```tsx
import { designTokens, cn } from '@/lib/designTokens';

// Usar tokens
<div className={cn(
  designTokens.glass.card,
  designTokens.rounded.card,
  designTokens.shadows.card,
  designTokens.transitions.hover
)}>
  <h1 className={designTokens.typography.h1}>Título</h1>
</div>
```

## 📋 Checklist de Implementação

Ao criar um novo componente, verificar:

- [ ] Header com gradiente purple e glassmorphism
- [ ] Cards com efeito de vidro (glassmorphism)
- [ ] KPIs com ícones coloridos e glow effects
- [ ] Hover animations (-translate-y-2)
- [ ] Tipografia hierárquica (h1, h2, body, label)
- [ ] Espaçamento compacto (p-4, gap-4, space-y-6)
- [ ] Bordas sutis (border-white/10)
- [ ] Transições suaves (transition-all duration-300)
- [ ] Responsividade (grid cols-1 sm:cols-2 lg:cols-4)
- [ ] Elementos decorativos com blur
- [ ] Focus states nos inputs
- [ ] Loading states nos botões
