# CROM Master Checklist (Fases 11+)

Este é o Roadmap Definitivo contendo mais de 50 tarefas para implementar todas as ideias do GDD.

### I. A Interface Diegética (Refatoração WorldBox)
- [x] **1.** Remover o CSS neon/hacker (`border: green`) do `style.css`.
- [x] **2.** Implementar molduras texturizadas (pedra esculpida, granito, madeira).
- [x] **3.** Ocultar menus laterais e criar uma *Bottom-Bar* colapsável.
- [x] **4.** Criar Aba "Ecologia" na bottom-bar (Ferramentas de terreno/infecção).
- [x] **5.** Criar Aba "Sociologia" na bottom-bar (Controle de Facções).
- [x] **6.** Criar Aba "Destruição" na bottom-bar (Disparo manual de meteoros).
- [x] **7.** Substituir textos longos por ícones Emojis Universais (🧬, ⚙️, 🌾).
- [x] **8.** Criar o HUD de Status Global compacto no canto superior direito (População, Era, Severidade).

### II. Fúria do Planeta (The Nemesis Tree)
- [x] **9.** Criar classe `PlanetEngine.js` com uma Árvore de Evolução de Desastres.
- [x] **10.** Raiz Atmosférica: Implementar Seca Global (Reduz K globalmente).
- [x] **11.** Raiz Biológica: Mutação de Fungos e Pandemias Incuráveis.
- [x] **12.** Raiz Geológica: Esgotamento Freático gerando Terremotos em áreas mineradoras.
- [x] **13.** Implementar a mecânica de "Desertificação".
- [x] **14.** Adicionar Fauna local agindo como "Resistência".
- [x] **15.** Despertar espécies sencientes nativas no Late-Game.

### III. Complexo Industrial e Monopólios
- [x] **16.** Refatorar Crafting para 4 etapas: Extração -> Design -> Fabricação -> Montagem.
- [x] **17.** Criar especialização de Facções.
- [x] **18.** Lógica de Logística: O item só é criado se conectado por rota.
- [x] **19.** Mecânica de Aquisição (Monopólio): Facções compram facções.
- [x] **20.** Adicionar o recurso `Água`.
- [x] **21.** Adicionar o recurso `Solo (Fertilidade)`.
- [x] **22.** Degradação de Confiança (Trust decai 5% ao ano).

### IV. Propagação, Relevo e Demografia Avançada
- [x] **23.** Adicionar atrito de terreno para montanhas.
- [x] **24.** Checagem de Clima (frio/tundra).
- [x] **25.** Infraestrutura Naval exige Portos.
- [x] **26.** Infraestrutura Aérea exige Aeroportos.
- [x] **27.** Assimilação Pacífica de facções menores.
- [x] **28.** Espionagem para roubar "Techs" passivamente.
- [x] **29.** Gerar "Refugiados" pós-Meteoro.

### V. As Árvores Finais (Biopunk, Cyberpunk e Dark Tech)
- [x] **30.** Tech Biopunk: "Fotossíntese Humana".
- [x] **31.** Tech Biopunk: "Gestação Artificial" (Remove necessidade de fêmeas).
- [x] **32.** Tech Cyberpunk: "Upload de Consciência" (Zera mortalidade e natalidade, K = Infinito).
- [x] **33.** Tech Cyberpunk: "Matriz de Simulação" (Gera 50 Trust por tick passivamente).
- [x] **34.** Tech Dark Tech: "Bomba de Antimatéria" (Destrói um node vizinho e seus recursos).
- [x] **35.** Tech Dark Tech: "Eugenia Algorítmica" (Purga facções minoritárias).
- [x] **36.** Tech Space: "Esfera de Dyson" (Energia infinita, multiplica produção).
- [x] **37.** Tech Space: "Arca Geracional" (Zera a população mundial mas garante a "Vitória").

### VI. Zero-Player Dinâmico (Bolhas Interativas)
- [x] **38.** Sistema Estocástico para tech (Traits base).
- [x] **39.** Bolha Flutuante de Fome (Aparece um ícone de pão se K < P).
- [x] **40.** Bolha Flutuante de Rebelião (Ícone vermelho se Trust < 0).
- [x] **41.** Bolha Flutuante de Fábrica (Ícone de engrenagem quando crafting finaliza).
- [x] **42.** Clique no Hexágono mostra Raio-X do node (População real, fertilidade).
- [x] **43.** Efeito Visual de "Nuvem Tóxica" em áreas muito poluídas.

### VII. Desfecho e Vitória (Telas Finais)
- [x] **44.** Tela de Derrota ("O Grande Filtro Venceu").
- [x] **45.** Tela de Vitória ("Transcendência: A Arca foi lançada").
- [x] **46.** Botão "Nova Simulação" resetando `Engine`.
- [ ] **47.** Efeitos Sonoros Diegéticos (Click de botões, Alarme de Nemesis).
- [ ] **48.** Painel de "Conquistas" (Achievements persistentes em localStorage).
- [x] **49.** Modo "Espectador Cósmico" (UI desaparece e mostra só o planeta rodando).
- [x] **50.** Refatorar D3.js para usar Cores baseadas na Temperatura/Bioma quando no zoom out.
- [x] **51.** Adicionar botão "Pausar/Play" no canto inferior.
- [ ] **52.** Teste Final de Estabilidade (Deixar rodar 10.000 anos sem crash).
