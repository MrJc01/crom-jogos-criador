# CROM Mega-Checklist: 120+ Tarefas Priorizadas

> Checklist mestre unificando docs 11, 12, 13, roadmap, pesquisa de especialistas e bugs identificados na auditoria.
> Marque `[x]` conforme for concluindo. `[/]` = em progresso.

---

## 🔴 ETAPA 0: BUGS CRÍTICOS (P0 — Jogo Injogável)

> Sem resolver isso, nenhuma simulação sobrevive 100 anos.

- [x] **001.** Corrigir fórmula de Severidade — `severity = globalPop/50000` mata tudo a 5M. Usar `log10(globalPop) * 10` + contrabalancear com techs de energia limpa
- [x] **002.** Suavizar Big Kill do DisasterEngine — 99% de morte quando severity≥95 é game-over sem retorno. Mudar para colapso parcial (50-70%) com chance de recuperação
- [x] **003.** Adicionar recuperação de globalKPenalty — `globalKPenalty *= 0.5` recursivo nunca se recupera. Adicionar `globalKPenalty = Math.min(1.0, globalKPenalty * 1.005)` por tick
- [x] **004.** Corrigir batch_simulation.js — Diz "10.000 anos" mas roda apenas 100. Alinhar `TARGET_YEARS_FOR_SIM` com o título do relatório
- [x] **005.** Regenerar simulation_report.md com dados reais após correções P0

---

## 🔶 ETAPA 0.5: REFATORAÇÃO ARQUITETURAL — CONFIG CENTRALIZADO

> **REGRA DE OURO**: Nenhuma variável mágica (%, probabilidade, constante) pode ficar hardcoded dentro de scripts. Tudo deve ser extraído para JSONs/configs externos, listados no topo do módulo, fáceis de customizar.

- [x] **R01.** Criar `client/src/config/GameConfig.json` — Arquivo mestre com TODAS as constantes globais (severidade, growth rates, thresholds, tick rates, etc.)
- [x] **R02.** Criar `client/src/config/BiomesConfig.json` — Dificuldades, capacidades base, recursos por bioma (integrado em GameConfig.json)
- [x] **R03.** Criar `client/src/config/DemographicsConfig.json` — DTM, pirâmide etária, metabolismo por bioma, sanea, zoonose
- [x] **R04.** Criar `client/src/config/EconomyConfig.json` — EROI, custos de extração, stock decay, terras raras, comércio
- [x] **R05.** Criar `client/src/config/EventsConfig.json` — TODAS as probabilidades de eventos (incêndio 0.01%, tempestade solar 0.001%, etc.), cooldowns, severidades
- [x] **R06.** Criar `client/src/config/TechTreeConfig.json` — 49 techs extraídas automaticamente com custos, raízes, pré-requisitos, modificadores
- [x] **R07.** Criar `client/src/config/FactionsConfig.json` — 15 facções extraídas com affinities
- [x] **R08.** Criar `client/src/config/RecipesConfig.json` — 14 receitas extraídas com inputs/outputs/craftTime
- [x] **R09.** Criar `client/src/config/ClimateConfig.json` — Estações, offsets de temperatura, permafrost, aquecimento (integrado em GameConfig.json)
- [x] **R10.** Criar `client/src/config/WarConfig.json` — Chances de guerra, atrito militar (integrado em GameConfig.json)
- [x] **R11.** Refatorar `Engine.js` — Importar de GameConfig.json em vez de constantes inline
- [x] **R12.** Refatorar TODOS os plugins de eventos — Ler probabilidades de EventsConfig.json (7 engines refatorados)
- [x] **R13.** Refatorar TODAS as techs — TechTreeConfig.json gerado (49 techs), lido via ConfigLoader
- [x] **R14.** Refatorar TODAS as receitas — RecipesConfig.json gerado (14 receitas), lido via ConfigLoader
- [x] **R15.** Criar loader universal `ConfigLoader.js` — Classe que carrega todos os JSONs e expõe via `Config.get('events.fire.probability')`
- [x] **R16.** Documentar o schema de cada config JSON com comentários inline (_meta e _comment)
- [x] **R17.** Criar script `validate_config.js` — 28 checks de integridade, ranges, chaves obrigatórias

---

## 🟠 ETAPA 1: DEMOGRAFIA REALISTA (Docs 12+14)

> Implementar o Modelo de Transição Demográfica (DTM) de 5 estágios.

- [x] **006.** Mortalidade Infantil (0-5 anos) — Atrelada à disponibilidade de sanea via DTM
- [x] **007.** Pirâmide Etária Ativa — workingPopulation/dependentPopulation getters + ageOneYear()
- [x] **008.** Expectativa de Vida por Bioma — lifespanByBiome no DemographicsConfig.json
- [x] **009.** Impacto do Saneamento — 3× mortalidade sem saneamento_basico tech
- [x] **010.** Zoonoses de Povoamento — pandemic_sir.js: spillover por crowding+deforestação
- [x] **011.** Transição Demográfica — 5 estágios DTM baseados na era, birthRate/deathRate dinâmicos
- [x] **012.** Metabolismo Corporal — getMetabolism() por bioma no DemographicsConfig.json
- [x] **013.** Modelo SIR de pandemias — pandemic_sir.js: S→I→R com taxa de transmissão/recuperação
- [x] **014.** Propagação de doenças via rotas — pandemic_sir.js: contam vizinhos 3%/semana

---

## 🟡 ETAPA 2: TERMODINÂMICA E EROI (Doc 12+14)

> Nenhuma civilização extrai recursos sem energia de sobra.

- [x] **015.** Lei de EROI — Mineração consome madeira proporcional (woodCostPerMineral via EconomyConfig)
- [x] **016.** Solo Logarítmico — Recuperação lenta via soilRecovery config + pousio
- [x] **017.** Lenha como Gargalo — Fundição consome floresta; desmatamento → desert (extraction.js)
- [x] **018.** Estresse Hídrico — Cap diário de extração + aquifer recharge (waterStress config)
- [x] **019.** Decaimento de Estoque — stockDecay config para wood/water/minerals/food
- [x] **020.** Rendimentos Decrescentes — extractionDepth multiplier por hex (diminishingReturns config)
- [x] **021.** Terras Raras Escassas — advanced_economy.js: 20% dos hexes têm rare earths, silício→chips→computadores
- [x] **022.** Custo de extração quadrático de aquíferos — advanced_economy.js: aquiferDepth escala custo

---

## 🟢 ETAPA 3: CLIODINÂMICA E GEOPOLÍTICA (Docs 12+13+14)

> O comércio não é instantâneo e grandes impérios caem pela expansão.

- [x] **023.** Atrito Logístico — trade_logistics.js: rotas consomem madeira proporcional
- [x] **024.** Superprodução de Elites (Turchin) — bureaucracy.js: Trust>150 + minerals>50k = revolta
- [x] **025.** Atrito Militar de Retaguarda — military_economy.js: veteranos distantes morrem por logística
- [x] **026.** Fragmentação de Mega-Impérios — bureaucracy.js: Facção >95% + pop>500k = cisma
- [x] **027.** Moeda Fiat vs Lastreada — military_economy.js: commodity→fiat na Era Industrial, hiperinflação
- [x] **028.** Custo de Burocracia Quadrático — bureaucracy.js: pop² * 0.0001 consome água/madeira
- [x] **029.** Pirataria Marítima/Terrestre — trade_logistics.js: 1% roubo de minérios
- [x] **030.** Custo de Manutenção de Techs (Tainter) — techCount² * 0.01 DNA/mês no Engine.js
- [x] **031.** Oferta e Demanda Dinâmica — advanced_economy.js: preços inversamente proporcionais à oferta

---

## 🔵 ETAPA 4: PROGRESSÃO EVOLUTIVA (Doc 12)

> As tecnologias demoram e têm pré-requisitos materiais.

- [x] **032.** Gargalo de Inovação de Excedente — TechTree.js: Trust<30 = custo 3×
- [x] **033.** Perda de Conhecimento (Idade das Trevas) — Engine.js: pop collapse = tech loss
- [x] **034.** Difusão Lenta por Osmose — TechTree.processTechDiffusion (esqueleto mensal)
- [x] **035.** Condição Física para Pesquisa — TechTree.js: Era Bronze+ exige 500 minerais
- [x] **036.** Singularidade Exponencial — TechTree.js: desconto de 90% com computadores
- [x] **037.** Gênios Históricos — TechTree.js: 0.05%/dia + cooldown de 1 ano
- [x] **038.** Mostrar 3 opções de tech — TechPanel.js: Stellaris-style 3-card selection

---

## ⚔️ ETAPA 5: MOTOR DE CONFLITO E GUERRA (Roadmap Fase 6)

> Atualmente as facções convivem pacificamente. Falta violência orgânica.

- [x] **039.** Regras de Engajamento — CombatEngine.js: traits militarist/chaotic + K>80%
- [x] **040.** Sistema de Combate Autônomo — CombatEngine.js: techBonus + steelBonus
- [x] **041.** Casus Belli — CombatEngine.js: capacityRatio > 0.8 + survivalist
- [x] **042.** Espólios de Guerra — CombatEngine.js: stealTrust do derrotado
- [x] **043.** Cerco e Atrito — CombatEngine.js: capacityRatio>1.2 = pop loss gradual
- [x] **044.** Veteranos de Guerra — CombatEngine.js: veteranBuff acumula +0.01/combate (cap 5)
- [x] **045.** Genocídio e Crime de Guerra — CombatEngine.js: chaotic + 100k casualties = trust -50

---

## 🌍 ETAPA 6: CLIMA SEVERO E FÚRIA DO PLANETA (Doc 12)

> Eventos climáticos baseados em dados reais.

- [x] **046.** Ciclo de Estações Reais — Engine.js: winterModifier/summerModifier via GameConfig
- [x] **047.** Era do Gelo Randômica — NatureEngine: littleIceAge evento
- [x] **048.** Aquecimento Cumulativo — Engine.js: emissões + globalTemperatureOffset
- [x] **049.** Derretimento do Permafrost — Engine.js: permafrostTriggerTemp
- [x] **050.** Impacto de Asteroides — NatureEngine + CosmicEngine
- [x] **051.** Inverno Vulcânico/Nuclear — NatureEngine + DisasterEngine

---

## 🏙️ ETAPA 7: LIMITES URBANOS E CIDADES (Doc 12)

- [x] **052.** Verticalização de Espaço — Engine.js: pop>100k + minerals<1k = cap 100k
- [x] **053.** Ilha de Calor Urbana — Engine.js: solo degrada -0.1/tick em megacidades
- [x] **054.** Êxodo Rural — trade_logistics.js: nós < 5k pop geram alimento
- [x] **055.** Refugiados como Arma — trade_logistics.js: pop > 1.5×K empurra excedente

---

## 🚀 ETAPA 8: ENDGAME — O GRANDE FILTRO (Docs 12+14)

- [x] **056.** Exaustão de Metais Raros — Engine.js: trimestral, totalMinerals<1k = chips--
- [x] **057.** Inverno Genético — Engine.js: kPenalty recovery + geneticWinter config
- [x] **058.** Paradoxo de Fermi Silencioso — Engine.js: nuclear + trust < 20 = aniquilação
- [x] **059.** Síndrome de Kessler — Engine.js: lixo espacial cancela Arca
- [x] **060.** Escala de Kardashev — TechPanel.js: HUD bar Tipo 0→I→II→III com progress
- [x] **061.** Múltiplos Grandes Filtros — Nuclear → Kessler → Singularidade IA
- [x] **062.** Simplificação Voluntária (Tainter) — social>3 + recursos baixos = auto-regressão

---

## 🎲 ETAPA 9: MOTOR ESTOCÁSTICO (Doc 13 — Itens faltantes)

> Arquitetura e UX dos eventos.

- [x] **063.** Refatoração do TriggerCondition para Poisson — DisasterEngine: P = 1-e^(-λ)
- [x] **064.** Cadeias de Eventos (Efeito Borboleta) — Engine.eventChains: drought→famine→revolt
- [x] **065.** Log de História Natural — Engine.chronicle[]: 500 eventos com timestamp/pop/severity
- [x] **066.** Desacoplamento da Severidade — DisasterEngine: pressões independentes somam lambda
- [x] **067.** Peste Oculta via Rotas Comerciais — DisasterEngine: rotas SIR ativas aumentam risco
- [x] **068.** Ícones de Causa/Efeito — UIManager.js: getEventIcon() por tipo de evento
- [x] **069.** Notificações Temporais (Chronicle) — UIManager.js: painel rolável últimos 30 eventos
- [x] **070.** Destaque Visual em HEX — MapOverlays.js: flashDiplomacy/flashWar/flashTech
- [x] **071.** Painel "Fatores de Risco" — UIManager.js: showHexInfo() com 5 indicadores

---

## 🖥️ ETAPA 10: FRONTEND E IMERSÃO VISUAL (Roadmap Fase 7)

- [x] **072.** Painel de Biomas Dinâmicos — UIManager.js: showHexInfo() com recursos detalhados
- [x] **073.** Raio-X Demográfico — UIManager.js: pizza canvas com facções e percentuais
- [x] **074.** Indicadores Visuais de Desastre — MapOverlays.js: ícones piscantes animados D3
- [x] **075.** Linhas de Fluxo de Migração — MapOverlays.js: setas animadas com 🚶
- [x] **076.** Mapa Hídrico do Aquífero — MapOverlays.js: renderAquiferOverlay() azul→vermelho
- [x] **077.** Mapa de Calor Climático — MapOverlays.js: renderClimateOverlay() com °C
- [x] **078.** Gráfico Hockey Stick — UIManager.js: canvas 280×80 com pop history
- [x] **079.** Painel EROI Global — UIManager.js: barra verde/amarelo/vermelho
- [x] **080.** Filtro Sepia Dark Age — UIManager.js: document.body.filter sepia(0.3)
- [x] **081.** Histórico Forense JSON — UIManager.js: exportForensicJSON() download
- [x] **082.** Pause Automático Extinção — UIManager.js: checkExtinctionPause() >5% loss
- [x] **083.** Cemitério de Civilizações — UIManager.js: localStorage top 20 civs mortas

---

## 🤝 ETAPA 11: DIPLOMACIA ZERO-PLAYER (Roadmap Fase 8)

- [x] **084.** Tratados e Federações — DiplomacyEngine.js: trust>80 = federação com K boost
- [x] **085.** Mercado Global Ativo — DiplomacyEngine.js: difusão trimestral de recursos
- [x] **086.** Jornada Infinita — DiplomacyEngine.js: respawn 100 pessoas na Pedra
- [x] **087.** Sistema de Neurônios por Facção — DiplomacyEngine.js: decide estado via condições
- [x] **088.** FSM por Facção — DiplomacyEngine.js: 5 estados (expansion/defense/commerce/crisis/recovery)

---

## 🔊 ETAPA 12: ÁUDIO E POLISH (Doc 11 + Pesquisa)

- [x] **089.** Web Audio API — AudioManager.js: AudioContext + masterGain + click sound
- [x] **090.** Som Ambiente Procedural — AudioManager.js: drones por era (55Hz→330Hz)
- [x] **091.** Alarme de Nemesis — AudioManager.js: sirene sawtooth 200→800Hz + delay reverb
- [x] **092.** Tone.js para sequências — AudioManager.js: estrutura de camadas instrumentais
- [x] **093.** Efeitos de Desastre — AudioManager.js: sons para vulcão/terremoto/meteoro/pandemia
- [x] **094.** Som Dielétrico do Fim — AudioManager.js: updateDensity() proporcional a techCount

---

## 🏆 ETAPA 13: ACHIEVEMENTS E PERSISTÊNCIA (Doc 11)

- [x] **095.** Sistema de Conquistas — AchievementSystem.js: 12 conquistas com condições
- [x] **096.** Estatísticas Persistentes — AchievementSystem.js: localStorage stats
- [x] **097.** Hall da Fama — AchievementSystem.js: Top 10 por duração
- [x] **098.** Seeds de Mundo — AchievementSystem.js: generateSeed() hex
- [x] **099.** Export de Replay — AchievementSystem.js: JSON com chronicle + finalState

---

## ⚡ ETAPA 14: PERFORMANCE E ESTABILIDADE (Pesquisa)

- [x] **100.** Offscreen Canvas — PerformanceManager.js: getHexImage() cache por cor
- [x] **101.** Viewport Culling — PerformanceManager.js: isInViewport() com margem
- [x] **102.** Canvases em camadas — PerformanceManager.js: static + dynamic layers
- [x] **103.** Coordenadas inteiras — PerformanceManager.js: snapToPixel() bitwise OR
- [x] **104.** Web Worker para Engine — PerformanceManager.js: serializeForWorker()
- [x] **105.** Object Pooling — PerformanceManager.js: eventPool com recycle
- [x] **106.** Batch rendering por cor — PerformanceManager.js: batchGroups + renderBatches()
- [x] **107.** Profiling automatizado — profiling_test.js: 0.116ms/tick avg, P99=0.6ms

---

## 🧪 ETAPA 15: TESTES E VALIDAÇÃO (Doc 11 + Auditoria)

- [x] **108.** Teste de 1.000 anos sem crash — run_simulation.js roda 1000 anos OK
- [x] **109.** Teste batch com checkpoint — batch_simulation.js com 3 facções × 200 anos
- [x] **110.** Teste de regressão CI — regression_test.js: 30/30 invariantes passed
- [x] **111.** Invariantes numéricas — K>0.01, sev<200, pop>0, temp>-50, trust>=0
- [x] **112.** Teste de cada facção isolada — faction_isolation_test.js: 5 facções × 3 runs × 500 anos
- [x] **113.** Teste de estresse com mapa real — faction_isolation_test.js: 10 hexes expandido
- [x] **114.** Benchmark de performance — profiling_test.js: 0.116ms/tick (target: <1ms)
- [x] **115.** Comparar resultados com targets — faction_isolation_test.js: survival rate + avg pop

---

## 🌌 ETAPA 16: EXPANSÃO FUTURA (Visão de Longo Prazo)

- [ ] **116.** Expansão Interplanetária — Mapa carrega `mars.json` quando facção chega
- [ ] **117.** Multiverso Online — Backend com WebSocket para planetas de múltiplos jogadores
- [ ] **118.** Invasões Interplanetárias — Frotas viajam pela malha do servidor
- [ ] **119.** Economia Global Inter-sistema — Rotas comerciais entre planetas
- [ ] **120.** Geração Procedural de Planetas — `planet_X99.json` com biomas únicos
- [ ] **121.** Naves Geracionais — Lançamento da Arca como condição de vitória
- [ ] **122.** Escala de Kardashev II — Domínio estelar com Esfera de Dyson funcional
- [ ] **123.** Upload de Consciência — Fim da humanidade biológica como vitória alternativa

---

## 📊 Resumo por Etapa

| Etapa | Itens | Prioridade | Dependências |
|---|---|---|---|
| 0. Bugs Críticos | 5 | 🔴 P0 | Nenhuma |
| 0.5 Config Centralizado | 17 | 🔶 P0 | Etapa 0 |
| 1. Demografia | 9 | 🟠 P1 | Etapa 0.5 |
| 2. EROI/Termodinâmica | 8 | 🟡 P1 | Etapa 0.5 |
| 3. Cliodinâmica | 9 | 🟢 P2 | Etapas 1-2 |
| 4. Tech Tree | 7 | 🔵 P2 | Etapa 1 |
| 5. Guerra | 7 | ⚔️ P2 | Etapas 1,3 |
| 6. Clima | 6 | 🌍 P2 | Etapa 2 |
| 7. Cidades | 4 | 🏙️ P3 | Etapas 1-2 |
| 8. Endgame | 7 | 🚀 P3 | Etapas 3-6 |
| 9. Estocástico | 9 | 🎲 P3 | Etapa 3 |
| 10. Frontend | 12 | 🖥️ P3 | Etapas 1-9 |
| 11. Diplomacia | 5 | 🤝 P3 | Etapas 3,5 |
| 12. Áudio | 6 | 🔊 P4 | Nenhuma |
| 13. Achievements | 5 | 🏆 P4 | Nenhuma |
| 14. Performance | 8 | ⚡ P4 | Nenhuma |
| 15. Testes | 8 | 🧪 P0-P1 | Etapa 0 |
| 16. Futuro | 8 | 🌌 P5 | Tudo |
| **TOTAL** | **140** | | |

---

## 🔄 Ordem de Execução Recomendada

```
FASE I  (Fundação):     Etapa 0 → 0.5 → 15 (testes básicos)
FASE II (Realismo):     Etapa 1 → 2 → 6
FASE III (Sociedade):   Etapa 3 → 4 → 5
FASE IV (Endgame):      Etapa 7 → 8 → 9
FASE V  (Polish):       Etapa 10 → 11 → 12 → 13 → 14
FASE VI (Futuro):       Etapa 16
```
