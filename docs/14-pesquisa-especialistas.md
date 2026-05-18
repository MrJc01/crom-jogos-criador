# 14. Pesquisa de Especialistas: Fundamentos Científicos e de Game Design

> Documento gerado a partir da simulação de 200 especialistas multidisciplinares analisando os requisitos do CROM Humanity Simulator. Abaixo estão os 5 papéis principais e suas contribuições consolidadas.

---

## 🧠 Painel de 5 Especialistas Simulados

| # | Papel | Especialidade | Foco no CROM |
|---|---|---|---|
| 1 | **Demógrafo Computacional** | Modelos populacionais, DTM, pirâmide etária | Curva-S, mortalidade infantil, transição demográfica |
| 2 | **Historiador Cliodinâmico** | Turchin, Tainter, ciclos seculares | Superprodução de elites, colapso de complexidade |
| 3 | **Engenheiro de Sistemas Energéticos** | EROI, termodinâmica, gargalos de recursos | Retorno energético, lenha como gargalo, exaustão |
| 4 | **Game Designer Sênior** | Plague Inc, WorldBox, Civilization, Stellaris | Árvore de tech, zero-player, feedback loops |
| 5 | **Epidemiologista Computacional** | Modelo SIR, zoonoses, densidade poblacional | Pandemias, transmissão via rotas comerciais |

---

## 1. Demografia e Crescimento Populacional (Demógrafo)

### 1.1 O Modelo Logístico (Curva-S)
A fórmula central já está no jogo: `P(t+1) = P(t) + r * P(t) * (1 - P(t)/K)`

**Armadilhas identificadas:**
- **Overshoot sem penalidade**: Quando `P > K`, o crescimento deveria ser **negativo** (fome, emigração). O CROM atual permite overshoot temporário sem morte em massa proporcional.
- **r alto em tempo discreto**: Com `r` muito alto, a simulação oscila violentamente (boom-bust). Precisa de um cap: `r_efetivo = min(r, 2.0)`.
- **K invisível para o jogador**: O jogador precisa ver *por que* o crescimento parou — "Falta de Moradia", "Escassez de Água".

### 1.2 Modelo de Transição Demográfica (DTM)
A humanidade real passou por **5 estágios demográficos**. O CROM deve simular isso:

| Estágio | Era do Jogo | Natalidade | Mortalidade | Pop Growth | Mecânica CROM |
|---|---|---|---|---|---|
| 1. Pré-Industrial | Pedra/Cobre | Alta | Alta | Estável/Baixa | `r` base baixo, mortalidade infantil 40-60% |
| 2. Transicional | Bronze/Ferro | Alta | Caindo rápido | **Muito Alta** | Medicina/saneamento reduz mortes, pop explode |
| 3. Industrial | Era Industrial | Caindo | Baixa | Desacelerando | Urbanização + educação = menos filhos |
| 4. Pós-Industrial | Era da Informação | Baixa | Baixa | Estável | `r` natural cai para ~0%, precisa de imigração |
| 5. Declínio | Era Espacial | Muito Baixa | Baixa | **Negativo** | Pop encolhe naturalmente sem biotech |

**Implementação sugerida:**
```javascript
// No plugin de gestação, calcular r baseado na Era:
const eraMultiplier = { 
  'Idade da Pedra': 0.005,      // Quase zero
  'Idade do Cobre': 0.008, 
  'Idade do Bronze': 0.015,     // Agricultura ajuda
  'Idade do Ferro': 0.02,
  'Era Industrial': 0.03,       // Pico explosivo
  'Era da Informação': 0.005,   // Transição demográfica
  'Era Espacial': -0.002        // Declínio natural
};
```

### 1.3 Pirâmide Etária Simplificada
O `Demographics.js` já tem `{ child: 0.2, young: 0.3, adult: 0.4, elder: 0.1 }`, mas:
- **Só adultos jovens (young)** devem migrar, lutar e minerar
- **Crianças e idosos** consomem recursos mas não produzem
- **Mortalidade por faixa**: Pandemias matam mais idosos; guerras matam mais jovens

---

## 2. Cliodinâmica e Ciclos Seculares (Historiador)

### 2.1 Modelo de Turchin (Ciclos Seculares)
Peter Turchin identificou ciclos de 200-300 anos com 4 variáveis:

| Variável | Descrição | Mapeamento CROM |
|---|---|---|
| **N** (População) | Crescimento logístico | `engine.globalPop` |
| **S** (Força do Estado) | Capacidade de governar | `engine.globalTrust` (proxy) |
| **E** (Dinâmica de Elites) | Superprodução de elites | **NÃO IMPLEMENTADO** ← CRÍTICO |
| **I** (Instabilidade) | Conflito interno | `engine.pressures.social` |

**O que falta (Superprodução de Elites):**
Em eras de ouro, o excedente gera "Elites Improdutivas" — pessoas que consomem mas exigem status. Quando as posições acabam, elas se radicalizam.

```javascript
// Proposta: Variável eliteOverproduction
if (engine.globalTrust > 150 && engine.globalPop > 1000000) {
    engine.eliteOverproduction = (engine.eliteOverproduction || 0) + 0.01;
}
// Quando eliteOverproduction > 1.0: Chance de Revolta Aristocrática
```

### 2.2 Modelo de Tainter (Colapso de Complexidade)
Joseph Tainter argumenta que civilizações colapsam porque o **custo de manter a complexidade** supera os benefícios:

- **Cada tech nova** deveria ter um **custo de manutenção** por tick (não só custo de compra)
- **Burocracias** crescem quadraticamente com a população
- **O colapso é racional**: Quando custa mais manter do que simplificar, a civilização "decide" regredir

**Implementação:** 
- Custo de manutenção = `unlockedTechs.size * unlockedTechs.size * 0.01` DNA/dia
- Se `adaptationPoints < 0`: A civilização perde techs automaticamente (simplificação)

### 2.3 Ciclo Integrative → Disintegrative

```
EXPANSÃO (Pop↑, Trust↑, Techs↑)
    ↓
ESTAGFLAÇÃO (Pop alta, recursos no limite, elites crescem)
    ↓
CRISE (Revoltas, guerras civis, fragmentação)
    ↓
DEPRESSÃO (Pop↓, Trust↓, Techs perdidos)
    ↓
RECUPERAÇÃO (Novo ciclo começa com menos gente mas mais espaço)
```

---

## 3. EROI e Termodinâmica (Engenheiro Energético)

### 3.1 EROI — Energy Return on Investment
Para extrair 100 de minério, precisa gastar X de energia (lenha/petróleo/nuclear):

| Fonte de Energia | EROI Histórico | Era do Jogo |
|---|---|---|
| Lenha/Carvão vegetal | 3:1 a 5:1 | Pedra → Ferro |
| Carvão mineral | 50:1 → 20:1 | Era Industrial |
| Petróleo (1930) | 100:1 | Era Industrial tardia |
| Petróleo (2020) | 15:1 → 5:1 | Era da Informação |
| Nuclear | 75:1 | Era Informação/Espacial |
| Solar/Eólica | 10:1 → 25:1 | Era Espacial |

**Implementação:**
```javascript
// Antes de extrair minerais, verificar se tem energia suficiente
const energyCost = extractionAmount / currentEROI;
if (engine.inventory.wood < energyCost && engine.inventory.energy < energyCost) {
    return; // Não pode minerar sem energia!
}
engine.inventory.wood -= energyCost; // Queima lenha para minerar
```

### 3.2 O Colapso do Bronze (Caso Real)
O colapso da Idade do Bronze (~1200 a.C.) foi causado porque:
1. Civilizações dependiam de lenha/carvão para fundir bronze
2. Desmataram tudo ao redor das cidades
3. O custo de buscar lenha distante superou o retorno
4. As rotas marítimas de comércio de madeira foram cortadas pelos "Povos do Mar"
5. **EROI caiu abaixo de 1:1** → Colapso em cascata

**Para o CROM**: Quando `wood < mineralsNeeded * 2`, a fundição para. Se o nó não tem vizinhos com madeira, a facção regride.

### 3.3 Solo e Rendimentos Decrescentes
- **Primeiro minério**: Fácil (superfície) → custo 1x
- **Segundo extração**: Precisa cavar → custo 1.5x
- **Terceira**: Poço profundo → custo 3x
- **Quarta**: Apenas com maquinário → custo 10x

```javascript
// Fator de exaustão por hexágono
node.extractionDepth = (node.extractionDepth || 0) + 1;
const cost = baseExtractionCost * Math.pow(1.5, node.extractionDepth);
```

---

## 4. Game Design: Lições dos Mestres (Designer)

### 4.1 Plague Inc. — O Modelo "Bolha + Evolução"
- **DNA Bubbles**: Bolhas de DNA são a moeda de atenção do jogador
- **Trade-off Infectividade × Severidade × Letalidade**: A humanidade no CROM É o "patógeno"
  - Infectividade = Taxa de natalidade e migração
  - Severidade = Industrialização (alerta o "sistema imune" do planeta)
  - Letalidade = Autoextinção
- **Evolução Autônoma**: No Plague Inc, mutações acontecem sozinhas (sem input do jogador)

### 4.2 WorldBox — O Modelo "Neurônio"
Cada unidade no WorldBox tem um **sistema de neurônios** com:
- **Cooldown**: Tempo entre ações
- **Weight**: Probabilidade de ativação
- **Priority**: Camadas de urgência (sobrevivência > crescimento > luxo)

**Para o CROM**: As facções deveriam ter "neurônios" que decidem entre:
1. Extrair recursos (sobrevivência)
2. Pesquisar (crescimento)
3. Expandir (ambição)
4. Guerrear (competição)

### 4.3 Civilization — Árvore de Tecnologias
- **Grafo Acíclico Dirigido (DAG)**: Cada tech tem pré-requisitos
- **Evitar Newbie Traps**: Nenhuma escolha deve ser "objetivamente errada"
- **Stellaris usa semi-randomização**: O jogador não vê toda a árvore, apenas 3 opções por vez
- **O CROM já faz isso** com `processAutonomousEvolution` — mas precisa mostrar as 3 opções ao jogador

### 4.4 Zero-Player Design Patterns
| Padrão | Uso no CROM |
|---|---|
| **Simulation Pattern** | ✅ `processTick()` já implementado |
| **State Pattern** | ⚠️ Parcial (facções não têm FSM própria) |
| **Observer Pattern** | ✅ `onEvent` callback |
| **Factory Pattern** | ✅ `SpeciesGenerator` |
| **Object Pooling** | ❌ Falta — centenas de hexágonos criam garbage |
| **ECS** | ❌ Poderia substituir o sistema de plugins |

---

## 5. Epidemiologia e Pandemias (Epidemiologista)

### 5.1 Modelo SIR (Susceptible → Infected → Recovered)
- **β (Taxa de Infecção)**: Proporcional à densidade poblacional
- **γ (Taxa de Recuperação)**: Dependente de tech (Medicina, Antibióticos)

**Para o CROM**: O modelo de pandemia atual é "mata X% e pronto". Deveria ser:
```javascript
// Cada nó tem uma variável de infecção
node.plagueState = { susceptible: 0.9, infected: 0.1, recovered: 0.0 };
// A cada tick:
const newInfected = beta * node.plagueState.susceptible * node.plagueState.infected;
const newRecovered = gamma * node.plagueState.infected;
```

### 5.2 Zoonoses e Density-Dependent Transmission
- **Desmatamento** + **aglomeração** = risco exponencial de spillover animal→humano
- **Rotas comerciais** espalham doenças (Peste Negra via Rota da Seda)
- **Trade routes no CROM** deveriam propagar debuffs de doença, não só recursos

### 5.3 Intervenções do Jogador
- Quarentena (corta migração mas corta comércio)
- Vacinação (caro em DNA, mas move S→R)
- Saneamento (reduz β permanentemente no nó)

---

## 6. Hidrologia e Ciclo da Água (Engenheiro Ambiental)

### 6.1 Aquífero como Recurso Finito
- **Custo de extração quadrático**: Quanto mais fundo, mais caro
- **Desertificação como feedback loop**: Solo seco → menos infiltração → aquífero seca mais rápido
- **Conectividade hídrica**: Bombar água em um nó afeta os vizinhos com delay temporal

### 6.2 Tragédia dos Comuns
Facções diferentes bombeando o mesmo aquífero competem sem coordenação → colapso total

---

## 7. Logística e Comércio Histórico (Economista)

### 7.1 Atrito por Distância
- **Terrestre** (caravana): Caro, lento, limitado a bens de luxo
- **Marítimo** (navio): Barato em volume, mas vulnerável a pirataria
- **Aéreo** (Late Game): Rápido, mas custo energético altíssimo

### 7.2 Implementação de Atrito
```javascript
// Cada rota de comércio consome recursos no caminho
const frictionCost = route.distance * route.terrainFriction;
const delivered = sentAmount - frictionCost;
if (delivered <= 0) return; // A viagem consumiu tudo
```

### 7.3 Oferta e Demanda Dinâmica
- **Preços mudam com escassez**: Se um nó tem muito minério, o preço cai
- **Distância aumenta preço**: Seda na China = barata; Seda em Roma = cara
- **Monopólios controlam preço**: Facção monopolista pode fixar preços

---

## 8. Áudio Procedural (Sound Designer)

### 8.1 Web Audio API para Diegetic Sound
- **Osciladores + Filtros**: Gerar vento, chuva, ruído urbano proceduralmente
- **Camadas dinâmicas**: O som muda com a Era (tribal drums → industrial noise → spacey synths)
- **Spatial Audio (PannerNode)**: Sons distantes ficam mais baixos
- **Trigger por eventos**: Explosão de vulcão = reverb + low-pass filter

### 8.2 Bibliotecas Recomendadas
- **Tone.js**: Alto nível, fácil de usar, ótimo para sequências
- **Howler.js**: Playback de samples, bom para efeitos sonoros
- **Web Audio API nativo**: Máximo controle, zero dependências

---

## 9. Colapso de Civilizações (Antropólogo)

### 9.1 Padrões Universais de Colapso (Tainter + Turchin)
1. **Fase de Expansão**: Pop↑, Recursos↑, Complexidade↑
2. **Fase de Estagflação**: Recursos no limite, elites crescem, rendimentos decrescem
3. **Fase de Crise**: Revoltas, guerras civis, pandemias, fragmentação
4. **Fase de Depressão**: Simplificação, perda de tech, recuperação lenta
5. **Novo Ciclo**: Com menos gente mas mais espaço → começa de novo

### 9.2 O Grande Filtro (Fermi)
O CROM já tem isso implementado! Mas precisa de mais nuance:
- **Escala de Kardashev**: Tipo 0 (planeta) → Tipo I (estrela) → Tipo II (galáxia)
- **Cada transição é um Grande Filtro**: Nuclear → Kessler → Singularidade → Heat Death
- **O jogo deveria mostrar a barra de Kardashev** no HUD como meta visual

---

## 10. Performance e Renderização (Engenheiro de Software)

### 10.1 Otimização de Canvas para Hexágonos
- **Offscreen Canvas**: Desenhar 1 hexágono uma vez, usar `drawImage()` para copiar
- **Viewport Culling**: Só renderizar hexágonos visíveis na tela
- **Canvases em camadas**: Estático (grid) + Dinâmico (unidades, efeitos)
- **Coordenadas inteiras**: `Math.floor()` para evitar anti-aliasing

### 10.2 Simulação em Worker Thread
- **Web Worker**: Mover o `processTick()` para uma thread separada
- **SharedArrayBuffer**: Compartilhar estado entre worker e UI thread
- **O ganho**: UI nunca trava, simulação roda independente a 60 TPS
