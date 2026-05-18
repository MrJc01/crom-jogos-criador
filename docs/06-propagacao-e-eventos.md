# Mecânicas de Jogo e Algoritmos

## O Loop de Crescimento Populacional
Baseado no modelo clássico de crescimento logístico. Em vez de uma propagação linear e ilimitada, a expansão desacelera à medida que o limite territorial é alcançado:
```math
P(t+1) = P(t) + r \cdot P(t) \cdot (1 - P(t)/K)
```
- `P`: População atual no Nó (Região).
- `r`: Taxa natural de crescimento (modificada por upgrades de Medicina e Agricultura).
- `K`: Capacidade de Carga da região (teto populacional suportado, que varia por clima e sofre boost via upgrades como Infraestrutura e Saneamento).

## Dinâmica de Migração (Propagação)
A cada "Tick" do jogo, uma região próspera buscará transferir parte de seu excedente populacional para nós adjacentes.
- **Via Terrestre**: Fricção baseada na fronteira (montanhas geram mais resistência que planícies). A migração terrestre inicial é orgânica e lenta.
- **Via Marítima**: Habilitada por meio da árvore tecnológica ("Navegação"). Adiciona arestas artificiais entre portos ao longo do mundo, transmitindo "infectados/colonos" repentinamente.
- **Via Aérea**: Habilitada no mid/late-game ("Aviação Comercial"). Cria rotas diretas, mas restritas aos países mais desenvolvidos/ricos.

## Árvore Tecnológica (Pontos de Evolução)
O jogador coleta "Pontos de Adaptação" observando bolhas no mapa ou passivamente baseado na população ativa global.
- **Árvore de Adaptação Biológica**:
  - Resistência climática (frio extremo, calor escaldante, altitude).
  - Sistemas imunológicos adaptados a patógenos locais.
- **Árvore Sociológica/Tecnológica**:
  - Sedentarismo e Agricultura (Aumenta o `K` drásticamente).
  - Industrialização (Aumenta o `r` massivamente, mas gera estresse ambiental).
  - Veículos e Transporte (Melhoram as taxas de migração).

## A Resposta do Sistema: Eventos de Feedback
A superexploração por parte da humanidade aciona os "Anticorpos do Planeta". Baseado no nível de gravidade (`Severidade`), ocorrem os seguintes eventos defensivos:
- **Eventos Locais**: Furacões, secas ou pandemias animais focadas em continentes de alta densidade para reduzir a população (o valor `P`).
- **Eventos Globais**: Mudanças climáticas que reduzem o `K` de todo o mapa simultaneamente.
- **Colapso**: Se a taxa de recuperação do planeta for zerada, o jogo entra em estado crítico, e o jogador deve correr contra o tempo evoluindo tecnologias de "Energia Limpa" antes da extinção.
