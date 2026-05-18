# The Realism Overhaul (Plano de Rebalanceamento Profundo)

Após uma análise transversal de toda a documentação, do `simulation_report.md` e do comportamento do código-fonte (em especial o "Grande Filtro" que assola todas as civilizações simuladas), ficou claro que as dinâmicas termodinâmicas, demográficas e ecológicas da simulação estão desalinhadas da realidade física e histórica humana. O crescimento é exponencial demais sem os freios da mortalidade infantil, a extração de recursos é rápida e irreal, e a logística funciona de forma quase mágica.

Aqui estão **50 Tarefas Sistêmicas** para injetar realismo histórico e termodinâmico no *CROM Humanity Simulator*.

---

### I. Demografia e Mortalidade Clínica
A curva "S" populacional atual sobe cedo demais. A humanidade levou dezenas de milhares de anos para bater a marca do 1º Bilhão de pessoas.
- [ ] **01. Fator de Mortalidade Infantil (0-5 anos):** Atrelar a morte infantil à disponibilidade de água limpa, travando a taxa `r` de expansão natural em ambientes primitivos.
- [ ] **02. Pirâmide Etária Simplificada:** Apenas populações ativas (adultos jovens) podem lutar guerras, migrar longas distâncias ou extrair minérios pesados. Crianças e Idosos consomem, mas não extraem.
- [ ] **03. Expectativa de Vida Baseada em Bioma:** Ambientes de selva aumentam infecções; invernos de tundra reduzem idosos sem calefação.
- [ ] **04. Impacto do Saneamento Básico:** Densidade populacional em cidades sem infraestrutura de esgoto causa multiplicador exponencial (x3) de mortalidade basal.
- [ ] **05. Zoonoses de Povoamento:** Aglomeração humana perto de gado/fauna (desmatamento) eleva o risco de "Pandemias Virais" (Peste Negra/COVID).
- [ ] **06. Desaceleração de Natalidade (Transição Demográfica):** Quanto mais educada e rica a facção (Era da Informação), mais a taxa de natalidade natural (`r`) cai para níveis de reposição (0% a -1%).
- [ ] **07. Calorias e Metabolismo Corporal:** Humanos em regiões frias consomem 1.5x mais comida (Lenha e Nutrição) do que em áreas temperadas para sobreviver.

### II. Termodinâmica e EROI (Retorno Energético)
Nenhuma civilização extrai minério massivo sem energia de sobra.
- [ ] **08. Lei de EROI (Energy Return on Investment):** Para minerar 100 de Ouro, é preciso queimar 50 de Madeira ou 10 de Petróleo. Se a relação EROI cair abaixo de 1.0, o colapso extrativista é iminente.
- [ ] **09. Capacidade de Carga de Solo Logarítmica:** A degradação agrícola é rápida, mas a recuperação do Solo não. Requer 10 anos de pousio para cada 1 ano de super-exploração.
- [ ] **10. Lenha como Gargalo do Bronze/Ferro:** A fundição consome tanta floresta que metrópoles ativas transformam rapidamente os biomas de *Floresta* em *Planícies/Desertos*.
- [ ] **11. Exaustão Aquática (Estresse Hídrico):** O "Rio Seca". Implementar um cap máximo de água extraível por Tick antes do aquífero desmoronar.
- [ ] **12. Decaimento de Estoque Físico:** Alimentos extraídos (comida) apodrecem anualmente (perda de -30% do estoque a cada ano) sem tecnologias de armazenamento/salga.
- [ ] **13. Fator de Rendimentos Decrescentes:** Os primeiros minérios são fáceis de achar, os últimos exigem profundidade. Cada extração num hexágono aumenta o custo de extrair a próxima unidade.
- [ ] **14. Escassez de Elementos de Terras Raras:** Computadores (Late Game) requerem Lítio/Silício que se concentram em hexágonos bem específicos, forçando guerras comerciais.

### III. Cliodinâmica, Geopolítica e Economia de Atrito
O comércio não é instantâneo e grandes impérios caem pela própria expansão.
- [ ] **15. Atrito Logístico (Distância Comercial):** Transportar recursos para nodes distantes (rotas globais) consome "óleo/comida" pelo caminho.
- [ ] **16. Superprodução de Elites (Ciclo de Turchin):** Em eras de ouro, excesso de Trust (Confiança) faz parte da população virar "Elite Improdutiva" que escoa recursos mas exige status, gerando revoltas.
- [ ] **17. Atrito Militar de Retaguarda:** Exércitos que viajam longe sem infraestrutura morrem 10x mais rápido de doenças/fome do que no combate.
- [ ] **18. Fragmentação de Mega-Impérios:** Uma facção muito grande e rica (Oligarquia Monopolista) deve fatalmente se partir em duas caso as periferias fiquem com Trust negativo.
- [ ] **19. Moeda Fiat vs Moeda Lastreada:** Quando uma facção imprime moeda digital ou desvincula do Ouro/Trust base, o crescimento explode, mas o risco de hiperinflação (crise sistêmica de escambo) dispara.
- [ ] **20. Custo de Burocracia:** O custo para construir e organizar coisas (Taxas) sobe com o quadrado do tamanho populacional do nó.
- [ ] **21. Pirataria Marítima/Terrestre:** Anomalias esporádicas no globo surgem nas rotas ricas e roubam/abatem a transferência passiva de bens.

### IV. Progressão Evolutiva (Tech Tree Freada)
As tecnologias demoram e têm pré-requisitos materiais.
- [ ] **22. Gargalo de Inovação de Excedente:** Sem um excedente gordo de comida estocada, a sociedade não gera "DNA/Pontos de Inovação". Sobrevivência nua não inova.
- [ ] **23. Tempo de Vida do Conhecimento:** Uma hecatombe de 50% de mortes pode fazer a civilização esquecer o Motor a Vapor ou a Escrita (Idade das Trevas).
- [ ] **24. Difusão Lenta por Osmose:** A tecnologia vizinha vaza por rotas de comércio, não precisa ser "re-pesquisada", poupando os pontos do país mais pobre.
- [ ] **25. Condição Física para Pesquisa:** Para desbloquear "Aço", é necessário sacrificar efetivamente minerais do baú, simulando tentativas e falhas (Protótipos).
- [ ] **26. A Singularidade é Exponencial:** O custo das últimas techs despenca à medida que o "Microchip" aumenta o poder computacional.
- [ ] **27. Gênios Históricos Estocásticos:** Probabilidade raríssima de que um Einstein nasça num país subdesenvolvido, cortando o tempo da pesquisa local violentamente e invertendo o poder da facção de um dia para o outro.

### V. Fúria do Planeta, Clima Severo e Eventos Especiais
- [ ] **28. Ciclo de Estações Reais:** A cada `(Tick % 365) / 4`, alterar entre Primavera, Verão, Outono, Inverno. Congelamento hídrico e interrupção do plantio.
- [ ] **29. Era do Gelo Randômica:** Desvios na órbita podem engatilhar uma Pequena Idade do Gelo por 1000 anos, comprimindo o mapa habitável para a linha do Equador.
- [ ] **30. Aquecimento Cumulativo (Efeito Estufa):** O subproduto da Industrialização altera passivamente a Temperatura Base Planetária ao longo dos séculos.
- [ ] **31. Derretimento do Permafrost:** Quando a Terra aquece, tundras descongeladas liberam carbono (Efeito Albedo Invertido), acelerando mortes por superaquecimento no equador.
- [ ] **32. Impacto de Asteroides Renovadores:** O evento *Meteoro* não só destrói a região como espalha um veio brutal de metais preciosos ou material cósmico para pesquisa no núcleo da cratera.
- [ ] **33. Inverno Vulcânico/Nuclear:** Poluição ou vulcanismo trava a regeneração do `Soil` em 0% globalmente durante décadas.

### VI. Limites Urbanos e Cidades
- [ ] **34. Verticalização de Espaço:** Um nodo atinge limite físico se não tiver infraestrutura de Aço e Concreto para prédios.
- [ ] **35. Efeito Ilha de Calor Urbana:** O hexágono principal de uma megalópole tem clima local próprio (Mortalidade acentuada sem condicionamento).
- [ ] **36. O Êxodo Rural Físico:** As fazendas produzem alimento e o transportam para as Cidades Gigantes de Aço, simulando a desconexão homem-terra na fase final.
- [ ] **37. Refugiados como Arma:** Expulsar propositalmente milhões de famintos para o vizinho na tentativa de colapsar o *K* deles.

### VII. A Árvore Endgame (O Grande Filtro Hard Science)
A Era Espacial e Cyberpunk não podem ser utópicas tão facilmente.
- [ ] **38. Exaustão de Metais Raros:** O limite de expansão de chips bate um muro de pedra quando as minas esgotam. O planeta trava sem poder construir foguetes ou energia eólica, forçando o encolhimento.
- [ ] **39. Inverno Genético:** Modificações genéticas prolongadas tornam o DNA humano frágil a uma única mutação viral surpresa, limpando o tabuleiro 10x mais rápido se não houver biodiversidade.
- [ ] **40. Paradoxo de Fermi Silencioso:** Se as corporações alcançam a Fissão Nuclear mas perdem Trust, a chance do "Tick de Disparo" apagar o nódulo do mapa torna-se iminente.
- [ ] **41. Síndrome de Kessler:** O lixo espacial, gerado pelo disparo prematuro de satélites, cancela permanentemente a possibilidade de lançar a Arca Geracional para a Vitória.

### VIII. Ferramentas Analíticas e Experiência do "Zero-Player"
Para assistir a esse espetáculo cruel em D3.js:
- [ ] **42. Mapa Hídrico do Aquífero:** Camada visual de "Onde tem água subterrânea", mostrando rios azuis secando visualmente conforme a indústria suga.
- [ ] **43. Mapa de Calor Climático Real:** Uma visualização termal (+1.0ºC, +2.0ºC) que reflete as emissões da bolha de Fábricas.
- [ ] **44. O Gráfico "Hockey Stick" Demográfico:** Uma UI que plota o trajeto real em linha ao longo dos séculos.
- [ ] **45. Painel de EROI Global:** Para o analista SRE observar se a raça humana está em deficiência energética.
- [ ] **46. Filtro Sepia para Idade das Trevas:** Se houver esquecimento de tecnologia (Dark Age), a tela do jogador assume tons frios.
- [ ] **47. Histórico Forense JSON:** Um botão de "Baixar Arquivos da Vida", fazendo dump de um JSON para pós-análise no R, Python ou Pandas.
- [ ] **48. Som Dielétrico do Fim:** Uma orquestração WebAudio que fica mais densa/urbana conforme a tecnologia do mundo progride, e silenciosa caso haja mortes em massa.
- [ ] **49. Pause Automático por Extinção Tática:** O jogo deve sempre pausar automaticamente se 5% da população global desaparecer de súbito (Eventos do Filtro).
- [ ] **50. Painel "Cemitério de Civilizações":** Uma base persistente de todas as vezes que você tentou brincar de Deus e a humanidade derreteu a si mesma.

---
> A implementação destas diretrizes transformará a simulação de um modelo logístico simplificado em um autômato termodinâmico-complexo da jornada humana pela sobrevivência perante O Grande Filtro.
