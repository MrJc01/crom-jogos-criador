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

## 🛠️ Modificações e Resiliência do Engine Core (`Engine.js`)

Para garantir estabilidade absoluta "Zero-Player" e evitar travamentos prolongados sob simulações de longa duração (overnight), implementamos uma arquitetura de resiliência em múltiplas camadas:

### 1. Blindagem SRE contra Exceções de Renderização e DOM
- **Tratamento de Erros no `tickLoop`**: O loop principal (`tickLoop`) está inteiramente protegido por um bloco `try/catch`. Caso ocorra qualquer erro na renderização ou processamento de um frame, o erro é capturado no console e o próximo frame é garantido através do agendamento seguro em `finally`, evitando que o jogo congele definitivamente.
- **Segurança no `onTick` callback**: Exceções geradas nos callbacks do frontend (como elementos do DOM nulos durante atualizações da sidebar) são isoladas por um bloco `try/catch`, impedindo que quebras na interface de exibição interrompam o motor lógico de simulação.
- **DOM Nulo Defensivo**: Todas as manipulações de interface (`updateSidebar`, `showFloatText`, `addNews`) usam seletores e checagens seguras contra elementos `null`, garantindo tolerância a falhas estéticas.

### 2. Controle Demográfico e Amortecimento de Sobrecarga (Caps Cósmicos)
- **Cap de Hexágono Local**: Introduzimos o `COSMIC_CAP = 10.000.000` (10 milhões) de habitantes por hexágono. Quando a população ultrapassa 80% do teto, um freio logarítmico reduz drasticamente a taxa de nascimentos futuros, estabilizando o crescimento.
- **Cap Global na Engine**: Definimos um limite de população global de `10.000.000.000` (10 bilhões) no motor do jogo para proteger o consumo de memória do navegador e prevenir estouro numérico.
- **Cooldown de Gênios**: A geração estocástica de prodígios em `TechTree.js` agora respeita um limitador estocástico calibrado pelo tempo de tick (`deltaDays`), limitando a ativação paralela de múltiplos cientistas e silenciando spawns de conquistas científicas infinitas.

### 3. Dispersão Nômade Calibrada (Pioneiros Fundadores)
- **Gatilhos para Pequenas Tribos**: Tribos nômades pequenas (< 500 habitantes) possuem agora uma probabilidade diária de dispersão muito superior (0.5% vs 0.01%) para estimular a expansão nos estágios iniciais.
- **Atrito Zero para Nômades Iniciais**: Bandos pioneiros terrestres menores que 150 indivíduos estão isentos do atrito letal severo de travessia e penalidades extremas de bioma (tundra/deserto), permitindo-lhes fundar colônias em hexágonos vizinhos vivos de forma viável.
- **Garantia de Sobrevivência Mínima**: O cálculo de sobrevivência na migração assegura que pelo menos 1 pioneiro sempre chegue ao destino, evitando colônias fantasma e permitindo a proliferação sustentável de tribos dispersas.

### 4. Reidratação Resiliente de Saves e Fallbacks Estáticos
- **StaticPlugins.js**: Adicionamos um carregador de fallback estático completo que mapeia manualmente todas as regras e módulos ecológicos na engine caso o carregamento assíncrono via `import.meta.glob` do Vite falhe.
- **Reidratação Geográfica de Saves**: A função `importSaveData` realiza um lookup estático robusto por ID e coordenadas normalizadas de hexágonos no mapa pré-gerado, restaurando o estado e reidratando as estruturas geográficas mesmo em saves parciais.

---

### 🧪 Suite de Testes e Validação
Todo este ecossistema de estabilidade e resiliência é validado através de uma suíte de testes unitários locais e testes de gameplay headless:
- **Testes Unitários (`npx vitest run`)**: Cobertura completa de regras demográficas, alocação de idades e alternância holográfica da UI, garantindo 100% de asserts aprovados.
- **Build de Produção (`npm run build`)**: Validação de empacotamento otimizado com árvore de dependências estática funcional e zero erros de transpilação.

O jogo alterna momentos de abundância com crises devastadoras, oferecendo um desafio equilibrado, resiliente e eterno.
