# Estudo de Design e Interface: Inspirado no WorldBox

O atual design do Crom está com um estilo neon/hacker (fundo escuro e bordas verdes). O usuário forneceu referências do jogo **WorldBox**, que usa uma linguagem visual completamente diferente: *Pixel Art, Molduras de Pedra, Alta Densidade de Ícones e UIs Diegéticas (que parecem pertencer ao mundo do jogo).*

Para adaptar o Crom a esse padrão *premium* e polido de "Deus/Simulador", documentamos aqui os pilares do refatoramento da UI.

## 1. A Paleta de Texturas (Diegesis Visual)
Ao invés de caixas de HTML chapadas com `border: 1px solid green`, a UI deve utilizar molduras texturizadas.
- **Fundo das Janelas:** Textura de pedra esculpida ou granito escuro.
- **Botões Base:** Placas de pedra ou madeira.
- **Botões Ativos/Destaque:** Detalhes em vermelho suave (como o botão de "Bolo/Aniversário" do WorldBox) para ações primárias.
- **Cores Semânticas de Dados:** Amarelo/Dourado para Conhecimento, Rosa/Coração para Reprodução, Vermelho/Caveira para Mortalidade.

## 2. O Menu Inferior (A Caixa de Ferramentas de Deus)
A interface não deve ficar esparramada pelas laterais. O padrão "God Game" exige uma barra inferor (`bottom-bar`) poderosa e colapsável.

**Estrutura da Toolbar Inferior:**
1. Aba: **Ecologia** (Infectar, Alterar Terreno).
2. Aba: **Sociologia** (Painel de Facções, Culturas).
3. Aba: **Árvore da Vida** (Laboratório de Pesquisas e Sabedoria Passiva).
4. Aba: **Complexo Industrial** (Economia e Receitas).
5. Aba: **Destruição** (Eventos Manuais ou Monitoramento de Severidade).

## 3. Substituir Texto por Ícones Universais
As imagens do WorldBox (como o painel *Homo Sapiens*) nos ensinam que a UI é compacta porque evita palavras.
- Em vez de escrever **"Custo de DNA"**, usamos um pequeno ícone de `[Hélice de DNA]`.
- Em vez de escrever **"Tempo de Fabricação"**, usamos uma pequena `[Ampulheta]`.
- Em vez de escrever **"Facção Espiritualista"**, usamos o símbolo de um `[Santuário]` ou `[Lótus]`.
- Em vez de escrever **"Taxa de Natalidade"**, usamos o ícone de `[Pão/Bebê]`.

> *Ao usar `display: grid` com colunas curtas e priorizando ícones 16x16px ou 24x24px, conseguimos comprimir 5x mais dados na mesma janela modal sem poluir a visão do usuário.*

## 4. O HUD de Status Global (Canto Direito)
Na tela principal, a visão desimpedida do Mapa Múndi (o Canvas) é a prioridade. As estatísticas globais devem ficar condensadas em um pequeno painel semi-transparente no canto.
- **População Mundial** (Ícone Humano: 0)
- **Facção Dominante** (Ícone Coroa: Tribais)
- **Ano/Era** (Ícone Ampulheta: Ano 1)
- **Barra de Severidade Planetária** (Uma barra que vai de verde para vermelho pulsante).

## 5. Próximos Passos (Plano de Refatoramento Front-End)
Para aplicar essa revolução visual, propomos:
1. Descartar completamente as linhas de CSS relacionadas a modais verdes/neon em `style.css`.
2. Adquirir ou gerar (via IA) um *sprite sheet* de UI estilo "Stone/Fantasy God Game" (Cantos de pedra, botões chanfrados).
3. Trocar todo o layout atual por CSS Grid/Flexbox voltado a "Toolbars" horizontais na base da tela.
4. Substituir as palavras do inventário/receitas por uma biblioteca de emojis pixelizados (ex: 🧬, ⚙️, 💻, 🌾).
