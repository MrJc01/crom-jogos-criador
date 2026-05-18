# 10. Evolução Autônoma e Dinâmicas de Coleta (Zero-Player Mode)

## 1. O Problema da Dependência do Jogador
Em *God Games* e simuladores macroeconômicos, forçar o jogador a tomar 100% das decisões de avanço tecnológico em microescala pode gerar uma "barreira de clique" (onde a simulação para no tempo esperando a intervenção humana). O jogador deve atuar como um jardineiro que poda e guia, e não como um engenheiro que constrói cada tijolo.

## 2. A Solução Estocástica (LLM e Probabilidades)
A introdução de uma **Evolução Autônoma** permite que a árvore de tecnologias (`TechTree`) floresça organicamente através de um algoritmo evolucionário baseado em "Pesos e Probabilidades", inspirado no funcionamento dos LLMs (Large Language Models) e Cadeias de Markov.

### A Mecânica "Zero-Player"
1. **Rede Neural de Probabilidades:** Cada tecnologia não pesquisada possui um "peso" de desbloqueio.
2. **Contexto Ativo (Tokens de LLM):** Assim como um LLM prevê a próxima palavra com base nas palavras anteriores, a sociedade do jogo "prevê" (desbloqueia) a próxima tecnologia baseada no ambiente:
   - *Exemplo:* Se a população está num Bioma de *Deserto* e a *Severidade (Falta de água)* está alta, a probabilidade de desbloquear "Saneamento Básico" ou "Agricultura" multiplica por 5x.
3. **Mutações Aleatórias (Temperatura):** Assim como o parâmetro *Temperature* nos LLMs introduz caos criativo, o jogo terá uma porcentagem de "Caos", onde uma tribo primitiva pode acidentalmente focar todo seu DNA para inventar algo totalmente inesperado.

## 3. Feedback Loop Interativo (O Sistema "Plague Inc.")
Se a evolução é autônoma, qual o papel ativo do jogador? **Acelerar e guiar a mutação através de *Popups/Bubbles***.
Baseado em mecânicas clássicas de *Idle/Clicker Games* e *Plague Inc.*:

### Bolhas de Coleta (Map Popups)
Conforme a simulação corre, **bolhas clicáveis** surgirão geograficamente acima de certos países no mapa (Canvas/SVG):
- 🧬 **Bolha Laranja (DNA Puro):** Surge aleatoriamente. Se clicada antes de sumir, dá um bônus imediato de Pontos de Adaptação (DNA), permitindo que o jogador antecipe a evolução autônoma.
- 🔴 **Bolha Vermelha (Caos/Severidade):** Surge em países onde a mortalidade está alta ou a capacidade chegou ao limite. Clicar nela coleta os dados da crise e dá bônus extras de evolução.
- ⚙️ **Bolha de Indústria:** Surge em centros corporativos, e clicar nela fornece um boost instantâneo no inventário físico (Madeira, Minerais).

**Loop Psicológico (Compulsion Loop):** 
Isso preenche a lacuna entre a jogabilidade "passiva" (assistir aos continentes mudando de cor) e a "ativa" (caçar popups espalhados pelo mapa para ganhar vantagem evolutiva). O jogo funciona 100% sozinho, mas um jogador atento otimiza a expansão brutalmente.
