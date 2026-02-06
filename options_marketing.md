# Opções de Implementação: Banner e Flyers

Aqui estão 3 abordagens inteligentes para coletar a informação se o vendedor deixou Banners ou Flyers na academia:

## 1. Abordagem "Chips Interativos" (Recomendada)
Em vez de um checkbox tradicional, usamos botões de estado (Chips) que são visualmente mais atraentes e rápidos no celular.

*   **Comportamento**: Dois botões: `[Banner]` e `[Flyers]`. 
*   **Estado Inicial**: Desmarcados (Cinza).
*   **Ação**: Ao clicar, eles ficam coloridos (Verde).
*   **Obrigatoriedade**: O sistema valida se o vendedor "tocou" na seção. Se ele não deixou nada, ele marca uma opção "Nenhum material deixado" ou o sistema exige que ele confirme o estado de ambos.

## 2. Abordagem "Checklist de Entrega"
Uma lista simples com ícones ao lado de cada item.

*   **Visual**:
    *   🚩 **Banner entregue?** (Sim / Não)
    *   📄 **Flyers entregues?** (Sim / Não)
*   **Inteligência**: Se marcar "Sim" para Banner, o sistema pode abrir automaticamente um campo para "Local da Instalação" (ex: Recepção, Fachada) ou sugerir uma foto.

## 3. Abordagem "Inventário de Saída"
Ideal se você quiser controlar a quantidade também.

*   **Interface**: Um pequeno modal que pergunta: "O que ficou na academia?".
*   **Opções**:
    *   [ ] Banner (1 unidade)
    *   [ ] Flyers (Quantidade aproximada: 10, 20, 50...)
*   **Vantagem**: Gera um relatório mais preciso para o estoque de marketing.

---

### Implementação Técnica Sugerida:
*   **Banco de Dados**: Colunas `left_banner` (boolean) e `left_flyers` (boolean) na tabela `visits`.
*   **Obrigatoriedade**: Validação no frontend antes de liberar o botão "Finalizar Visita".

**Qual dessas opções faz mais sentido para o fluxo de trabalho dos seus vendedores?**
