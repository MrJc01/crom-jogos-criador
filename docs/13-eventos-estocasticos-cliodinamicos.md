# Plano de Implementação: O Motor Estocástico e Eventos Circunstanciais

Após realizar pesquisas profundas sobre modelos de **Cliodinâmica** (como os de Peter Turchin) e sistemas de eventos em jogos de *Grand Strategy*, concluí que o seu diagnóstico está corretíssimo: o mundo atual é muito determinístico. As coisas acontecem "em massa" ou não acontecem. A natureza da história humana é uma mistura de **pressão estrutural** (ex: muita gente com fome) com **eventos aleatórios imprevisíveis** (ex: o assassinato de um líder ou um inverno rigoroso) que funcionam como o "risco de fósforo" no barril de pólvora.

Para resolver isso, criei este novo checklist focado em **Eventos Probabilísticos, Efeitos Borboleta e Refatoração Estrutural**. Nenhum evento terá "data marcada". Todos usarão distribuições de probabilidade que aumentam de acordo com as circunstâncias (ex: a chance de um incêndio florestal aumenta 1% a cada dia de seca).

---

## 🛠️ Arquitetura do Novo Motor de Eventos
- `[ ]` **01. Refatoração do `TriggerCondition`:** Todos os plugins de evento passarão a usar a fórmula de Poisson para gerar eventos, abandonando timers fixos.
- `[ ]` **02. Sistema de "Pressão e Gatilho":** Criar variáveis globais ocultas (Ex: Tensão Política, Estresse Tectônico, Tensão Econômica) que sobem passivamente e aumentam a chance de sorteios (`Math.random() < pressao`).
- `[ ]` **03. Cooldowns Dinâmicos:** Eventos grandes devem gerar "Trauma", um cooldown invisível que impede o mesmo desastre de acontecer repetidamente na mesma geração.
- `[ ]` **04. Cadeias de Eventos (Efeito Borboleta):** O motor agora suportará "Eventos Encadeados". Uma *Seca* (A) gera a tag *Fome* (B) que multiplica em 10x a chance de *Revolta Camponesa* (C).
- `[ ]` **05. Log de História Natural:** Registrar todos os eventos no terminal/UI em uma "Timeline" persistente para o jogador poder ler a história daquela Terra.
- `[ ]` **06. Desacoplamento da Severidade:** Atualmente quase todos os eventos dependem da variável global `engine.severity`. Devemos ter rolagens independentes para o clima, biologia e sociedade.

---

## 🌪️ Eventos Exógenos (A Natureza Aleatória)
Estes eventos testam a resiliência das facções.
- `[ ]` **07. Incêndio Florestal Estocástico:** Chance base de 0.01% ao dia em biomas com muita Madeira, dobrada no "Verão" e triplicada se não chover. Destrói parte da madeira.
- `[ ]` **08. Tempestade Solar (Flares):** Chance randômica baixa. Se ocorrer na Idade da Informação, zera o Trust e paralisa indústrias por 30 dias. Inofensiva na Idade da Pedra.
- `[ ]` **09. Tsunami Localizado:** Se um nó litorâneo (a definir) sofrer terremoto, há 20% de chance de atingir o nó vizinho destruindo as rotas comerciais.
- `[ ]` **10. Praga de Gafanhotos:** Ocorre aleatoriamente em Planícies. Reduz o Solo (Fertilidade) a 0 por 1 ano.
- `[ ]` **11. Eclipse Solar Prolongado:** Evento puramente cósmico que reduz a extração de recursos drasticamente por um período, aumentando religiões animistas.
- `[ ]` **12. Mutação Gênica Aleatória:** Um cidadão nasce imune a um vírus, transferindo essa "resistência" para 10% da população em 5 anos.
- `[ ]` **13. Terremotos de Falhas Ocultas:** Podem acontecer mesmo sem mineração exagerada, matando uma % fixa e abrindo "Veios de Ouro" (aumentando minérios máximos).

---

## ⚔️ Eventos de Cliodinâmica e Sociedade
Eventos engatilhados pela panela de pressão social humana.
- `[ ]` **14. O Assassino Famoso:** Se a facção for um Império grande, há chance de o líder ser assassinado, fraturando o nó em duas facções que iniciam Guerra Civil instantânea.
- `[ ]` **15. Revolta dos Camponeses:** Engatilhada se `(População > Capacidade)` e `Trust > 10.000`. Os ricos estocam enquanto os pobres passam fome. Destrói Trust e população.
- `[ ]` **16. Cisma Religioso:** Com uma probabilidade muito baixa durante a "Era de Ouro", uma nova religião/ideologia surge em uma cidade, causando atrito.
- `[ ]` **17. Descoberta de um Novo Filósofo:** Chance rara (0,005%) em nós urbanos. Fornece dezenas de pontos de *DNA (Adaptação)* instantaneamente.
- `[ ]` **18. A Queda de Roma (Decadência):** Se uma facção ficar grande demais e sem guerras por muito tempo, a "Corrupção Burocrática" corrói os estoques silenciosamente.
- `[ ]` **19. A Epidemia da Loucura (Histeria Coletiva):** Evento onde o isolamento e estresse extremo geram o abandono voluntário de tecnologias (Ludditismo).
- `[ ]` **20. A Peste Oculta (Zoonose de Vetores):** Diferente do vírus normal, este evento espalha um debuff através de *Rotas Comerciais* em vez de matar direto.
- `[ ]` **21. Mártir Popular:** Um civil morre executado em praça pública, elevando absurdamente a chance de revolução naquele nó na semana seguinte.
- `[ ]` **22. Movimento Neo-Luddita:** Trabalhadores sabotam indústrias e destroem fábricas aleatoriamente se a transição para máquinas for rápida demais.
- `[ ]` **23. Migração em Massa Inesperada (O Pânico):** Um boato falso de "Fim do Mundo" faz 20% da população de um nó migrar mesmo com tudo perfeito.

---

## 🏗️ Eventos Tecnológicos e Econômicos (Acidentes Industriais)
A modernidade traz seus próprios riscos probabilísticos.
- `[ ]` **24. Colapso de Mina de Carvão:** Se a taxa de extração estiver no máximo, chance de explosão que mata milhares de trabalhadores (reduz Pop ativa).
- `[ ]` **25. Vazamento de Óleo/Tóxico:** Destrói a Água potável de um nó inteiro instantaneamente, gerando fila de mortalidade infantil.
- `[ ]` **26. Quebra da Bolsa de Valores (Crash):** Chance base em civilizações modernas com Trust inflacionado. Zera o Trust de *todas* as facções conectadas (Efeito Dominó).
- `[ ]` **27. Epidemia de Códigos Defeituosos (Y2K Real):** A infraestrutura de Microchips falha. Todos os estoques de Chips perdem 50% de valor.
- `[ ]` **28. Acidente Nuclear Estocástico:** Após descobrir Energia Nuclear, a cada dia há 0,001% de chance de um reator derreter (Chernobyl), irradiando o hexágono.
- `[ ]` **29. Avanço Médico Brilhante (Sorte):** Os laboratórios acidentalmente curam uma doença, aumentando a expectativa de vida global permanentemente em +5 anos.
- `[ ]` **30. Cartelização Secreta:** Corporações fixam preços em segredo. O custo de todas as *receitas de indústria* dobra por 10 anos.
- `[ ]` **31. Revolta das Máquinas (IA Alucinada):** Antes da IA Geral, bots financeiros dão tilt e limpam as contas bancárias (Trust) aleatoriamente em 1 segundo.

---

## 🗺️ Eventos Geopolíticos de Fronteira
A interação de estados de forma imprevisível.
- `[ ]` **32. Casamento Diplomático:** Chance aleatória de duas facções inimigas se unirem instantaneamente (100% de assimilação de uma na outra) devido a arranjo entre elites.
- `[ ]` **33. Incidente de Fronteira (Casus Belli Falso):** Mesmo com regras pacifistas, um soldado atira acidentalmente, forçando as duas facções a ignorarem seus *traits* pacifistas e irem à guerra.
- `[ ]` **34. Pirataria Tecnológica Massiva:** O nó mais pobre hackeia o mais rico e recebe a tecnologia de ponta instantaneamente (Robin Hood Hacker).
- `[ ]` **35. O Boom dos Refugiados de Ouro:** Um influxo maciço de migrantes altamente escolarizados chega em uma facção, impulsionando a P&D local incrivelmente.
- `[ ]` **36. Descoberta Arqueológica:** Um acidente de mineração revela ruínas antigas (ou ovnis), gerando um boost massivo em tecnologias não relacionadas (ex: Biologia no deserto).
- `[ ]` **37. Seita Suicida:** O surgimento de um culto apocalíptico que autoextermina um nó populacional de 50.000 pessoas repentinamente.
- `[ ]` **38. Epidemia de Esterilidade Randômica:** Por fatores ambientais desconhecidos (microplásticos + poluição), a taxa de natalidade do nó trava em 0 durante 2 anos.
- `[ ]` **39. A Paz de Natal (Trégua de Inverno):** Guerras em biomas de Inverno têm uma pequena chance de entrarem em armistício automático espontâneo, salvando milhões.
- `[ ]` **40. Sabotagem de Infraestrutura de Água:** Terroristas secam ativamente a reserva de água da facção rival.

---

## 🌌 Anomalias do Desconhecido (The Weird & The Wild)
Eventos muito raros (0,0001% de chance) mas altamente impactantes.
- `[ ]` **41. O Obelisco (Evento 2001):** Um monólito surge, dobrando a agressividade e a pesquisa tecnológica de quem detém o território.
- `[ ]` **42. O Silêncio Total (A Doença de Príons):** Uma praga mental silenciosa onde pessoas simplesmente param de se comunicar, destruindo o ganho de Conhecimento e Trust por 1 ano.
- `[ ]` **43. Sincronicidade Global:** Por alguma razão, a chance de revolta cai a zero no mundo inteiro simultaneamente por 1 mês.
- `[ ]` **44. Queda de Satélite em Área Urbana:** Mata civis e a população adquire paranoia contra tecnologias da árvore espacial.
- `[ ]` **45. Despertar Criogênico:** Se o planeta quase morrer, os mortos em suspensão animada (tecnologias cyberpunk) "acordam", gerando um fluxo bizarro de população desatualizada no mundo destruído.
- `[ ]` **46. O Milagre do Solo:** Planícies desmatadas brotam flores estanhamente férteis do nada (Chance minúscula de restaurar Soil para 100%).

---

## 🖥️ UX para Feedback dos Eventos Efeitos Borboleta
Para você entender que não foi "do nada".
- `[ ]` **47. Ícones de Causa/Efeito no Terminal:** Mostrar `(Causa: Seca Prolongada -> Efeito: Incêndio)` na UI do evento.
- `[ ]` **48. Notificações Temporais:** Histórico rolável na lateral (The Chronicle) para ver os últimos 50 eventos estocásticos.
- `[ ]` **49. Destaque Visual em HEX:** Quando o Casamento Diplomático acontecer, os dois hexágonos emitem um flash branco juntos.
- `[ ]` **50. Painel "Fatores de Risco":** Clicar em um território mostra as probabilidades acumuladas (Ex: *Risco de Revolta: 8%*; *Risco de Zoonose: 14%*).
