# CROM Simulation Engine — Zero-Player Expansion

> **Versão:** 3.0 (Expansão Sistêmica)
> **Módulos Adicionados:** 50 novos scripts `.js` + 3 novos arquivos `.json` + 2 painéis de UI
> **Total do Ecossistema:** 168 arquivos gerenciados pelo `Engine.js`

Este documento detalha a arquitetura da expansão sistêmica do CROM. O simulador evoluiu de um simples modelo demográfico para um ecossistema complexo "Zero-Player", onde a civilização deve combater a Lei de Tainter (colapso por complexidade) através de motores sociológicos, econômicos e biológicos interdependentes.

---

## 🌍 O Paradigma "Zero-Player"

O jogo opera de forma autônoma. Populações, facções e governos tomam decisões baseadas nas condições locais (fome, moral, densidade, tecnologia), gerando uma narrativa emergente de ascensão e queda civilizatória. O jogador/observador pode intervir como uma "mão invisível", mas as engrenagens rodam sozinhas.

### 🏛️ Módulos Principais

#### 1. Agricultura & Sobrevivência (`modules/agriculture/`)
- **FarmingEngine:** Produção baseada em bioma, irrigação, clima sazonal e tipo de solo. Sem comida por 60 dias causa morte e canibalismo emergente.
- **LivestockEngine:** Domesticação emergente de 5 tipos de animais. Animais consomem comida mas geram um alto retorno calórico.
- **Irrigation & Crop Rotation:** Monoculturas degradam o solo. A IA alterna colheitas automaticamente para evitar o colapso do solo. Canais de irrigação transferem água entre hexágonos vizinhos.
- **Fishery:** Hexágonos costeiros podem pescar. Sobrepesca e extinção de cardumes forçam a busca por novas fontes de alimento.
- **FamineEngine:** Avalia o déficit alimentar global. Déficits moderados causam migração forçada, enquanto déficits extremos causam guerras por comida.

#### 2. Governança & Leis (`modules/governance/`)
- **GovernmentEngine:** Governos evoluem de Tribos a Democracias/Tecnocracias com base na população e taxa de alfabetização.
- **GovernanceExpansion:** Governos utilizam "Policy Cards" (Ex: Racionamento, Lei Marcial). Impostos são cobrados com base no tipo de governo. Leis emergem organicamente (Ex: Direitos de Propriedade, Saúde Universal).
- **ElectionEngine:** Em democracias, as facções votam. Fraudes eleitorais podem ocorrer, gerando instabilidade social.
- **EspionageEngine:** Espionagem ativa entre facções rivais: roubo de tecnologia, sabotagem industrial e incitação a revoltas.

#### 3. Felicidade, Crime & Cultura (`modules/happiness/` & `modules/culture/`)
- **MoraleEngine:** 11 fatores locais definem a felicidade. Moral alta desencadeia "Eras de Ouro", moral baixa causa revoluções.
- **CrimeEngine:** A superlotação e a pobreza geram 4 tipos de crimes (furto, homicídio, corrupção, tráfico). Policiamento autônomo.
- **Amenities & Festivals:** Populações constroem praças, arenas e tavernas. Festivais sazonais e Jogos Olímpicos ocorrem para curar pressões sociais.
- **Culture & Language:** Facções geram linguagens únicas (barreira comercial) e produzem arte. Culturas dominantes podem converter vizinhos pacificamente ("Cultural Victory").
- **ReligionEngine:** Religiões procedurais com doutrinas variadas (pacifismo, sacrifício, misticismo). Expansão por missionários, construção de templos, secularização (quando a alfabetização sobe) e cismas (quando a religião fica muito grande).

#### 4. Infraestrutura & Comércio (`modules/infrastructure/` & `modules/trade/`)
- **Transport & Communication:** De trilhas a aeroportos, e de sinais de fumaça à internet. A infraestrutura reduz o atrito geográfico e espalha consciência.
- **EnergyEngine:** Biomassa → Carvão → Petróleo → Nuclear → Solar → Fusão. Sem energia, a indústria para; com energia suja, a temperatura global sobe.
- **Market & Currency:** Preços flutuantes baseados em oferta/demanda global. Inflação e hiperinflação. Facções criam moedas procedurais (ex: Dracmas, Florins) e aplicam sanções/embargos.
- **Trade Routes:** Rotas de comércio conectam excedentes a déficits.

#### 5. Ciência, Biologia & Conhecimento (`modules/education/` & `modules/biology/`)
- **ScienceEngine & Philosophy:** A pesquisa é acelerada por Universidades (Peer Review). Correntes filosóficas emergem (Racionalismo, Existencialismo) definindo modificadores de pesquisa e fé.
- **BioExpansion (Genética, Nutrição, Ecologia):** Isolamento causa endogamia (vulnerabilidade a doenças). Dietas variadas curam escorbuto e anemia. Desmatamento destrói a biodiversidade, levando à extinção e desertificação do solo.
- **KnowledgeBase:** Conhecimentos tácitos (Agropecuária, Medicina) acumulam passivamente, garantindo bônus invisíveis de resiliência e produtividade.

#### 6. Desastres & Eventos Sistêmicos (`modules/events/`)
- Cascatas estocásticas em cadeia: `famine_crisis`, `religious_war`, `revolution`, `great_depression` e `plague_locusts`. Todos afetam dezenas de métricas simultaneamente e empurram o jogo para novas direções sociológicas.

#### 7. Vitória (`modules/victory/`)
- O jogo observa se a humanidade sobrevive 10.000 anos, domina todos os hexágonos, transcende pela ciência (Esfera de Dyson + Arca Geracional), unifica pela cultura, religião ou federação diplomática.

---

## 🛠️ Modificações no Engine Core (`Engine.js`)

Para suportar esta arquitetura sem explodir a performance, o `Engine.js` foi adaptado para:
1. **Injeção de Módulos Otimizada:** O `loadPlugins` agora carrega 15 diretórios através de `import.meta.glob`.
2. **Safety Checks no Game Loop:** Plugins agora precisam expor `typeof applyTick === 'function'` para não crashear (Techs e Receitas são roteados de forma distinta).
3. **Inicialização de Variáveis:** O `startInfection` agora preenche o hexágono com variáveis críticas (comida inicial de 500 unidades, fauna base de 100) garantindo que a civilização consiga começar sem morrer de fome no dia 1.

### 🧪 Suite de Testes e Validação
Todo este ecossistema passou nos 30 cenários de regressão do `regression_test.js` com sucesso (`Exit code 0`), garantindo estabilidade sistêmica mesmo com as novas pressões predatórias de fome, clima, desastres e mortalidade ativas. O jogo alterna momentos de abundância com crises devastadoras, oferecendo um desafio equilibrado.
