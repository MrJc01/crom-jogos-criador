import { GameEngine } from './core/Engine.js';
import { MapRenderer } from './ui/MapRenderer.js';
import { FactionsData } from './core/FactionsData.js';
import { ResourceDictionary } from './core/ResourceDictionary.js';
import { UIManager } from './ui/UIManager.js';
import { SaveSystem } from './core/SaveSystem.js';
import { Config } from './config/ConfigLoader.js';

// Injeta o HTML estrutural no DOM antes de referenciar os elementos
UIManager.injectCoreUI();

const engine = new GameEngine();
const numFormat = new Intl.NumberFormat('pt-BR');

const uiGlobalPop = document.getElementById('global-pop');
const uiDate = document.getElementById('game-date');
const uiSeverity = document.getElementById('global-severity');
const uiFaction = document.getElementById('dominant-faction');
const uiDNA = document.getElementById('global-dna');
const uiEra = document.getElementById('game-era');

// Inventario Global
const uiInvWood = document.getElementById('inv-wood');
const uiInvMinerals = document.getElementById('inv-minerals');
const uiInvSteel = document.getElementById('inv-steel');
const uiInvSilicon = document.getElementById('inv-silicon');
const uiInvChips = document.getElementById('inv-chips');
const uiInvComputers = document.getElementById('inv-computers');

const toastContainer = document.getElementById('toast-container');
const btnPlayPause = document.getElementById('btn-play-pause');
const speedBtns = document.querySelectorAll('.speed-btn');
const panelCountry = document.getElementById('country-info');
const panelInstructions = document.getElementById('instructions');
const tooltip = document.getElementById('tooltip');

let selectedCountryId = null;
let autoStartTimeout = null;

// Expor função para os botões do HTML (gambiarra rápida para modules)
window.buyTech = (id) => {
    if (engine.buyTechnology(id)) renderTechList();
};

window.startCraft = (id) => {
    if (engine.craftItem(id)) renderIndustryList();
};

function renderTechList() {
    const techContainer = document.getElementById('tech-list');
    techContainer.innerHTML = '';
    
    // Agrupar todas as tecnologias por raiz (root)
    const groups = {};
    const rootNames = {
        'biology': '🧬 Biológica',
        'physics': '⚛️ Física',
        'philosophy': '👁️ Filosófica',
        'social': '🤝 Social',
        'industry': '⚙️ Tecnológica',
        'spiritual': '🕊️ Espiritual',
        'nemesis': '🌋 Fúria Planetária',
        'ideology': '🎭 Mutação Ideológica'
    };

    engine.techTree.technologies.forEach(tech => {
        const root = tech.root || 'industry';
        if (!groups[root]) groups[root] = [];
        groups[root].push(tech);
    });

    const availableTechs = new Set(engine.techTree.getAvailable().map(t => t.id));

    for (const root in groups) {
        const categoryHeader = document.createElement('h2');
        categoryHeader.style.color = '#00ddff';
        categoryHeader.style.borderBottom = '1px solid #333';
        categoryHeader.style.marginTop = '15px';
        categoryHeader.style.paddingBottom = '5px';
        categoryHeader.textContent = rootNames[root] || root;
        techContainer.appendChild(categoryHeader);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '1fr 1fr';
        grid.style.gap = '10px';
        techContainer.appendChild(grid);

        groups[root].forEach(tech => {
            const isUnlocked = engine.techTree.unlocked.has(tech.id);
            const isAvailable = availableTechs.has(tech.id);
            const isLocked = !isUnlocked && !isAvailable;
            
            const cost = engine.techTree.getModifiedCost(tech, engine);
            const canAfford = engine.adaptationPoints >= cost;
            
            const card = document.createElement('div');
            card.className = 'item-card';
            
            if (isUnlocked) card.style.borderColor = '#3a5a3a';
            else if (isLocked) card.style.borderColor = '#333';
            else card.style.borderColor = canAfford ? '#825a47' : '#555';
            
            card.innerHTML = `
                <h3 style="color: ${isLocked ? '#666' : '#fff'}">${tech.name}</h3>
                <div class="item-stat" style="color: ${isLocked ? '#666' : '#aaa'}">
                    <span>🧬 ${cost}</span> 
                    <span>${isUnlocked ? '✅' : (isLocked ? '🔒' : (canAfford ? '💡' : '❌'))}</span>
                </div>
                <button class="item-action-btn" onclick="buyTech('${tech.id}')" ${!isAvailable || !canAfford ? 'disabled' : ''} style="background: ${isUnlocked ? '#111' : (isAvailable && canAfford ? '#3a5a3a' : '#222')}; color: ${isUnlocked ? '#555' : '#fff'}">
                    ${isUnlocked ? 'SABIDO' : (isLocked ? 'BLOQUEADO' : 'PESQUISAR')}
                </button>
            `;
            grid.appendChild(card);
        });
    }
}

function renderIndustryList() {
    const recipeContainer = document.getElementById('recipe-list');
    recipeContainer.innerHTML = '';
    
    // Mostra as fornalhas ativas primeiro
    engine.economy.activeCrafts.forEach(craft => {
        const recipe = engine.economy.recipes.get(craft.recipeId);
        const card = document.createElement('div');
        card.className = 'item-card';
        card.style.borderColor = '#c4302b';
        card.innerHTML = `
            <h3>${recipe.name}</h3>
            <div class="item-stat"><span style="color:#ffaa00">Em Forja...</span> <span>⏳ ${craft.ticksRemaining}</span></div>
        `;
        recipeContainer.appendChild(card);
    });

    engine.economy.recipes.forEach(recipe => {
        let inStr = '';
        if (recipe.inputs.minerals) inStr += `${recipe.inputs.minerals}🪨 `;
        if (recipe.inputs.steel) inStr += `${recipe.inputs.steel}⛓️ `;
        if (recipe.inputs.chips) inStr += `${recipe.inputs.chips}💻 `;
        if (recipe.inputs.adaptationPoints) inStr += `${recipe.inputs.adaptationPoints}🧬 `;
        if (!inStr) inStr = 'Grátis';

        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <h3>${recipe.name}</h3>
            <div class="item-stat"><span title="Custo">${inStr}</span> <span title="Tempo">⏳ ${recipe.craftTimeTicks}</span></div>
            <button class="item-action-btn" onclick="startCraft('${recipe.id}')">FABRICAR</button>
        `;
        recipeContainer.appendChild(card);
    });
}

function renderFactionsList() {
    const factionsContainer = document.getElementById('factions-list');
    factionsContainer.innerHTML = '';
    
    const entries = Object.entries(engine.globalDemographics.factions).sort((a, b) => b[1] - a[1]);
    
    for (const [fac, count] of entries) {
        if (count < 1) continue;
        const facData = FactionsData.getFaction(fac);
        const row = document.createElement('div');
        row.className = 'faction-row';
        row.innerHTML = `<span style="font-size:24px; color:${facData.baseColor};">🎭 ${facData.name}</span> <span style="font-size:24px;">👥 ${Math.floor(count).toLocaleString()}</span>`;
        factionsContainer.appendChild(row);
    }
}

// Renderer Init
const renderer = new MapRenderer('#worldCanvas', engine, {
    onHover: (node, event) => {
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
        tooltip.classList.remove('hidden');
        tooltip.innerHTML = `<strong>${node.name}</strong><br>Pop: ${numFormat.format(node.demographics.total)}`;
    },
    onMouseOut: () => {
        tooltip.classList.add('hidden');
    },
    onClick: (node) => {
        if (autoStartTimeout) {
            clearTimeout(autoStartTimeout);
            autoStartTimeout = null;
        }
        selectedCountryId = node.id;
        updateSidebar(node);
        if (engine.year === 1 && engine.day === 0 && !node.infected) {
            engine.startInfection(node.id);
            panelInstructions.classList.add('hidden');
            renderer.update();
            engine.play();
            btnPlayPause.innerHTML = '▶️';
            btnPlayPause.style.background = '#2d6b35';
        }
    },
    onBubbleClick: (type) => {
        if (type === 'dna') {
            engine.adaptationPoints += 250;
            uiDNA.textContent = numFormat.format(engine.adaptationPoints);
            showFloatText('+250 DNA', '#ffaa00');
        } else if (type === 'crisis') {
            engine.adaptationPoints += 600;
            uiDNA.textContent = numFormat.format(engine.adaptationPoints);
            showFloatText('+600 DNA (Estudo de Crise)', '#ff4444');
        }
    }
});

const uiManagerInstance = new UIManager(engine, renderer);

let activeTabId = 'tab-monitor';

function switchTab(tabId) {
    document.querySelectorAll('.deck-tab-btn').forEach(btn => {
        if (btn.dataset.tab === tabId) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    document.querySelectorAll('.deck-tab-content').forEach(content => {
        if (content.id === tabId) content.classList.add('active');
        else content.classList.remove('active');
    });

    activeTabId = tabId;

    if (tabId === 'tab-tech') renderTechList();
    else if (tabId === 'tab-industry') renderIndustryList();
    else if (tabId === 'tab-factions') renderFactionsList();
}

function toggleDeck(tabId) {
    const deck = document.getElementById('control-deck');
    if (!deck) return;
    if (deck.classList.contains('hidden')) {
        deck.classList.remove('hidden');
        switchTab(tabId);
    } else if (activeTabId === tabId) {
        deck.classList.add('hidden');
    } else {
        switchTab(tabId);
    }
}

function showFloatText(msg, color) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.style.color = color || '#00ff88';
    toast.textContent = msg;
    const container = (typeof toastContainer !== 'undefined' ? toastContainer : null) || document.getElementById('toast-container');
    if (container) {
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}

renderer.init().then(() => {
    const loadingScreen = document.getElementById('loading-screen');
    const godPanel = document.getElementById('god-panel');
    const valWar = document.getElementById('val-war');
    const valDisaster = document.getElementById('val-disaster');
    const valTech = document.getElementById('val-tech');
    const valGrowth = document.getElementById('val-growth');
    const valDNA = document.getElementById('val-dna');

    // Fiação das sub-abas do Painel de Deus (Estética modular / Responsivo)
    document.querySelectorAll('.god-tab-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const targetTabId = btn.dataset.godTab;
            
            // Alterna botões ativos
            document.querySelectorAll('.god-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Alterna exibição das abas
            document.querySelectorAll('.god-tab-content').forEach(content => {
                if (content.id === targetTabId) content.classList.add('active');
                else content.classList.remove('active');
            });
            
            showFloatText(`🌌 Setor Ativado: ${btn.textContent.slice(2).trim()}`, '#00ddff');
        };
    });

    // Função de feedback tátil e coloração dinâmica dos parâmetros físicos
    function updateSliderStyles() {
        const warEl = document.getElementById('config-war');
        const disasterEl = document.getElementById('config-disaster');
        const techEl = document.getElementById('config-tech');
        const growthEl = document.getElementById('config-growth');
        const dnaEl = document.getElementById('config-dna');

        if (warEl && valWar) {
            const val = parseInt(warEl.value);
            valWar.textContent = val + '%';
            if (val < 5) valWar.style.color = '#00ff88'; // Ciano calmo
            else if (val <= 10) valWar.style.color = '#ffaa00'; // Amarelo alerta
            else valWar.style.color = '#ff00ff'; // Rosa destrutivo
        }
        if (disasterEl && valDisaster) {
            const val = parseInt(disasterEl.value);
            valDisaster.textContent = val + '%';
            if (val < 75) valDisaster.style.color = '#ff00ff'; // Crítico
            else if (val <= 110) valDisaster.style.color = '#ffaa00'; // Moderado
            else valDisaster.style.color = '#00ff88'; // Seguro
        }
        if (techEl && valTech) {
            const val = parseFloat(techEl.value);
            valTech.textContent = val.toFixed(1) + 'x';
            if (val < 0.8) valTech.style.color = '#00ff88'; // Acelerado
            else if (val <= 1.5) valTech.style.color = '#00ddff'; // Padrão
            else valTech.style.color = '#ff5500'; // Difícil
        }
        if (growthEl && valGrowth) {
            const val = parseInt(growthEl.value);
            valGrowth.textContent = val + '%';
            if (val < 6) valGrowth.style.color = '#ffaa00'; // Devagar
            else if (val <= 12) valGrowth.style.color = '#00ff88'; // Saudável
            else valGrowth.style.color = '#ff00ff'; // Explosivo
        }
        if (dnaEl && valDNA) {
            const val = parseInt(dnaEl.value);
            valDNA.textContent = val;
            if (val < 120) valDNA.style.color = '#00ff88'; // Eficiente
            else if (val <= 250) valDNA.style.color = '#00ddff'; // Padrão
            else valDNA.style.color = '#ffaa00'; // Complexo
        }
    }

    // Função de fade-out suave para o painel de Deus
    function hideGodPanel() {
        if (!godPanel) return;
        godPanel.style.opacity = '0';
        godPanel.style.transform = 'scale(1.05)';
        setTimeout(() => {
            godPanel.style.display = 'none';
        }, 800);
    }

    // Mapeamento dos sliders e labels com verificações de integridade
    const inputs = ['config-war', 'config-disaster', 'config-tech', 'config-growth', 'config-dna'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.oninput = () => updateSliderStyles();
        }
    });

    // Coloração inicial do menu
    updateSliderStyles();

    // Dicionário de presets físicos pré-calibrados do CROM
    const presets = {
        'default': { war: 5, disaster: 95, tech: 1.0, growth: 8, dna: 200 },
        'chaos': { war: 15, disaster: 70, tech: 2.0, growth: 12, dna: 350 },
        'abundant': { war: 2, disaster: 150, tech: 0.6, growth: 14, dna: 100 }
    };

    // Aplicação dinâmica de presets na tela de início
    window.applyPreset = (presetName) => {
        const p = presets[presetName];
        if (!p) return;
        
        const warEl = document.getElementById('config-war');
        const disasterEl = document.getElementById('config-disaster');
        const techEl = document.getElementById('config-tech');
        const growthEl = document.getElementById('config-growth');
        const dnaEl = document.getElementById('config-dna');

        if (warEl) warEl.value = p.war;
        if (disasterEl) disasterEl.value = p.disaster;
        if (techEl) techEl.value = p.tech;
        if (growthEl) growthEl.value = p.growth;
        if (dnaEl) dnaEl.value = p.dna;

        // Atualiza as cores e labels imediatamente
        updateSliderStyles();

        document.querySelectorAll('.preset-select-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`preset-${presetName}`);
        if (activeBtn) activeBtn.classList.add('active');
        
        showFloatText(`🌌 Preset '${presetName.toUpperCase()}' aplicado!`, '#00ddff');
    };

    // Importador de saves e reinicialização estruturada da simulação
    function importSaveData(saveData) {
        try {
            if (!saveData || !saveData.nodes || saveData.nodes.length === 0) {
                throw new Error("O save está incompleto ou corrompido (sem nós geográficos).");
            }
            
            // Pausa motor antes de carregar
            engine.pause();
            
            if (autoStartTimeout) {
                clearTimeout(autoStartTimeout);
                autoStartTimeout = null;
            }

            // Carrega usando o SaveSystem
            const success = SaveSystem.load(saveData, engine);
            if (!success) throw new Error("Erro interno na desserialização do save.");
            
            // Reconstrói e sincroniza os nós no renderer usando backup imutável
            renderer.hexNodes = saveData.nodes.map(n => {
                const originalList = renderer.originalHexNodes || renderer.hexNodes || [];
                const matched = originalList.find(h => String(h.id) === String(n.id));
                return {
                    id: n.id,
                    name: n.name,
                    x: matched ? matched.x : 0,
                    y: matched ? matched.y : 0,
                    biome: { id: n.biomeId }
                };
            }).filter(h => h.x !== 0);

            // Reconstrói vizinhanças
            engine.nodes.forEach((node, id) => {
                const idx = parseInt(id.replace('hex_', ''));
                const neighbors = [];
                if (idx > 0 && engine.nodes.has(`hex_${idx - 1}`)) neighbors.push(`hex_${idx - 1}`);
                if (idx < saveData.nodes.length - 1 && engine.nodes.has(`hex_${idx + 1}`)) neighbors.push(`hex_${idx + 1}`);
                if (idx >= 5 && engine.nodes.has(`hex_${idx - 5}`)) neighbors.push(`hex_${idx - 5}`);
                if (idx < saveData.nodes.length - 5 && engine.nodes.has(`hex_${idx + 5}`)) neighbors.push(`hex_${idx + 5}`);
                node.neighbors = neighbors;
            });
            
            // Esconde Menu e Loading
            hideGodPanel();
            if (loadingScreen) loadingScreen.style.display = 'none';
            if (panelInstructions) panelInstructions.classList.add('hidden');
            
            // Força atualização da UI e do Mapa
            renderer.update();
            if (selectedCountryId) {
                const node = engine.nodes.get(selectedCountryId);
                if (node) updateSidebar(node);
            }
            
            // Inicia e sincroniza interface
            engine.play();
            btnPlayPause.innerHTML = '▶️';
            btnPlayPause.style.background = '#2d6b35';
            document.body.classList.add('game-running');
            
            showFloatText(`🌍 Linha Temporal Restaurada: Ano ${engine.year}!`, '#00ff88');
        } catch (err) {
            console.error("Falha ao carregar save:", err);
            alert(`Erro na injeção da Linha Temporal: ${err.message}`);
            if (loadingScreen) loadingScreen.style.display = 'none';
        }
    }

    // Carregar Saves do Servidor estático
    window.loadPresetSave = async (fileName) => {
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.querySelector('h1').textContent = 'Injetando Linha Temporal...';
            loadingScreen.querySelector('p').textContent = `Carregando arquivo ${fileName} do servidor estático...`;
        }
        try {
            const res = await fetch(`/saves/${fileName}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            importSaveData(data);
        } catch (e) {
            console.error("Erro no fetch do save:", e);
            if (loadingScreen) loadingScreen.style.display = 'none';
            showFloatText("❌ Erro ao baixar save predefinido!", "#ff4444");
        }
    };

    // Upload de Save Local por seletor de arquivos
    const fileInput = document.getElementById('import-save-file');
    const triggerBtn = document.getElementById('btn-trigger-upload');
    if (triggerBtn && fileInput) {
        triggerBtn.onclick = (e) => {
            e.stopPropagation();
            fileInput.click();
        };
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const data = JSON.parse(evt.target.result);
                        importSaveData(data);
                    } catch (err) {
                        alert("Arquivo corrompido: erro ao analisar o JSON do save.");
                    }
                };
                reader.readAsText(file);
            }
        };
    }

    // Drag-and-Drop de Save Local
    const dropZone = document.getElementById('save-drop-zone');
    if (dropZone) {
        dropZone.ondragover = (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        };
        dropZone.ondragleave = () => {
            dropZone.classList.remove('dragover');
        };
        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.name.endsWith('.json')) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    try {
                        const data = JSON.parse(evt.target.result);
                        importSaveData(data);
                    } catch (err) {
                        alert("Falha ao processar o JSON do save solto na tela.");
                    }
                };
                reader.readAsText(file);
            }
        };
    }

    if (loadingScreen) loadingScreen.style.display = 'none';
    if (godPanel) godPanel.style.display = 'flex';

    document.getElementById('btn-start-universe').onclick = () => {
        // Aplica calibrações científicas no engine.config
        const warVal = parseFloat(document.getElementById('config-war').value) / 100.0;
        const disasterVal = parseInt(document.getElementById('config-disaster').value);
        const techVal = parseFloat(document.getElementById('config-tech').value);
        const growthVal = parseFloat(document.getElementById('config-growth').value) / 100.0;
        const dnaVal = parseInt(document.getElementById('config-dna').value);

        engine.config.warChance = warVal;
        engine.config.disasterThreshold = disasterVal;
        engine.config.techCostMultiplier = techVal;
        
        // Inicializa ou atualiza sub-objetos para evitar erros de Typings se algum script ler diretamente daqui
        if (!engine.config.demographics) engine.config.demographics = {};
        engine.config.demographics.baseGrowthRate = growthVal;
        engine.config.baseGrowth = growthVal; // Propriedade plana correspondente a baseGrowth no construtor

        if (!engine.config.dnaGeneration) engine.config.dnaGeneration = {};
        engine.config.dnaGeneration.popPerPoint = dnaVal;
        
        // Mutar também o singleton global Config para que as leituras de Config.get(...) sejam sincronizadas!
        if (Config && Config._game) {
            if (!Config._game.warConfig) Config._game.warConfig = {};
            Config._game.warConfig.warChance = warVal;
            Config._game.warConfig.techCostMultiplier = techVal;

            if (!Config._game.severity) Config._game.severity = {};
            Config._game.severity.disasterThreshold = disasterVal;

            if (!Config._game.demographics) Config._game.demographics = {};
            Config._game.demographics.baseGrowthRate = growthVal;

            if (!Config._game.dnaGeneration) Config._game.dnaGeneration = {};
            Config._game.dnaGeneration.popPerPoint = dnaVal;
        }

        hideGodPanel();
        showFloatText('🌎 Constantes Universais Calibradas!', '#00ddff');

        // Autostart após 5 segundos de inatividade
        autoStartTimeout = setTimeout(() => {
            if (engine.globalPop === 0 && engine.year === 1 && engine.day === 0) {
                // Encontra hexágonos de terra adequados (não deserto ou montanha)
                const landNodes = Array.from(engine.nodes.values()).filter(n => n.biome && n.biome.id !== 'desert' && n.biome.id !== 'mountain');
                const startNode = landNodes.length > 0 ? landNodes[Math.floor(Math.random() * landNodes.length)] : Array.from(engine.nodes.values())[0];
                
                selectedCountryId = startNode.id;
                updateSidebar(startNode);
                
                engine.startInfection(startNode.id);
                panelInstructions.classList.add('hidden');
                renderer.update();
                engine.play();
                btnPlayPause.innerHTML = '▶️';
                btnPlayPause.style.background = '#2d6b35';
                showFloatText(`🌌 Simulação Automática: Tribo fundada em ${startNode.name}!`, '#00ddff');
            }
        }, 5000);
    };

    const newsFeed = document.getElementById('news-feed-list');
    function addNews(msg, color, dataObj = null) {
        const feed = (typeof newsFeed !== 'undefined' ? newsFeed : null) || document.getElementById('news-feed-list');
        if (!feed) return;

        const item = document.createElement('div');
        item.style.color = color;
        item.style.paddingBottom = '3px';
        item.style.borderBottom = '1px dashed #333';
        
        // Tarefa 97: Ícones de Causa/Efeito no Terminal (Ano e Tipo)
        let prefix = '';
        if (dataObj && dataObj.type) {
            prefix = `<span style="font-size: 10px; opacity: 0.5; display: block; margin-bottom: 2px;">[Ano ${engine.year}] ${dataObj.type.toUpperCase()}</span>`;
        }
        
        item.innerHTML = `${prefix}<span>${msg}</span>`;
        feed.prepend(item);
        
        // Tarefa 98: Notificações Temporais (The Chronicle - 50 eventos max)
        if (feed.children.length > 50) feed.lastChild.remove();
    }

    const eventsQueue = [];

    // Limites de processamento por frame (prevenir sobrecarga D3/DOM)
    const MAX_BUBBLES_PER_FRAME = 3;
    const MAX_MIGRATIONS_PER_FRAME = 3;
    const MAX_DOM_EVENTS_PER_FRAME = 3;

    engine.onEvent = (data, type) => {
        eventsQueue.push({ data, type });
    };

    function processEventsQueue() {
        if (eventsQueue.length === 0) return;

        let bubblesProcessed = 0;
        let migrationsProcessed = 0;
        let domEventsProcessed = 0;

        const remainingEvents = [];

        for (const event of eventsQueue) {
            const { data, type } = event;

            if (type === "bubble_spawn") {
                if (bubblesProcessed < MAX_BUBBLES_PER_FRAME) {
                    renderer.spawnBubble(data);
                    bubblesProcessed++;
                }
            } else if (type === "migration_event" || type === "trade") {
                if (migrationsProcessed < MAX_MIGRATIONS_PER_FRAME) {
                    if (type === "trade") {
                        addNews(data.message || data, '#f1c40f', data);
                        showFloatText("🚢 COMÉRCIO", '#f1c40f');
                        if (data.sourceId) renderer.animateBlink(data.sourceId, '#f1c40f');
                        if (data.targetId) renderer.animateBlink(data.targetId, '#f1c40f');
                        renderer.animateMigration(data);
                    } else {
                        renderer.animateMigration(data);
                    }
                    migrationsProcessed++;
                }
            } else {
                if (domEventsProcessed < MAX_DOM_EVENTS_PER_FRAME) {
                    if (data && data.nodeId && renderer.animateBlink) {
                        renderer.animateBlink(data.nodeId, data.color || '#ffffff');
                    }

                    if (type === "disaster" || type === "warning") {
                        const color = data.color || (type === "warning" ? '#ffaa00' : '#ff4444');
                        addNews(data.message || data, color, data);
                        showFloatText(data.message || data, color);
                    } else if (type === "war") {
                        addNews(data.message || data, '#ff7700', data);
                        showFloatText("⚔️ GUERRA", '#ff7700');
                    } else if (type === "cosmic" || type === "milestone") {
                        const color = data.color || '#9b59b6';
                        addNews(data.message || data, color, data);
                        showFloatText(type === "cosmic" ? "☄️ EVENTO CÓSMICO" : "👁️ ASCENSÃO", color);
                    } else if (type === "nemesis") {
                        addNews(data.message || data, data.color || '#ff00ff', data);
                        showFloatText("🐺 RESISTÊNCIA / TENSÃO", data.color || '#ff00ff');
                    } else if (type === "tech_auto") {
                        showFloatText(`💡 Evolução: ${data}`, '#00ddff');
                        const deck = document.getElementById('control-deck');
                        if (deck && !deck.classList.contains('hidden') && activeTabId === 'tab-tech') {
                            renderTechList();
                        }
                    }
                    domEventsProcessed++;
                } else {
                    if (type === "disaster" || type === "cosmic" || type === "tech_auto" || type === "war") {
                        remainingEvents.push(event);
                    }
                }
            }
        }

        eventsQueue.length = 0;
        if (remainingEvents.length > 0) {
            eventsQueue.push(...remainingEvents.slice(0, 10));
        }
    }

    engine.onTick = () => {
      // Processa a fila acumulada de eventos
      processEventsQueue();

      // TAREFA 46: Filtro Sepia para Idade das Trevas
      if (engine.peakGlobalPop > 100000 && engine.globalPop < engine.peakGlobalPop * 0.3) {
          document.body.classList.add('dark-age-filter');
      } else {
          document.body.classList.remove('dark-age-filter');
      }
      
      // TAREFA 49: Pause Automático por Extinção Total
      if (engine.globalPop === 0 && engine.year > 1 && engine.isRunning) {
          engine.pause();
          showFloatText("EXTINÇÃO TOTAL. Jogo Pausado.", "#ff0000");
          const playBtn = document.getElementById('btn-play-pause');
          if (playBtn) playBtn.innerHTML = '▶️';
          
          // TAREFA 48: Som Dielétrico do Fim
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(50, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 4);
          gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 4);
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 4);
      }

      uiGlobalPop.textContent = numFormat.format(engine.globalPop);
      
      // TAREFA 45: Painel de EROI Global
      const eroiEl = document.getElementById('inv-eroi');
      if (eroiEl) {
          const eroiValue = (engine.inventory.wood > 0) ? "100%" : "10%";
          eroiEl.textContent = eroiValue;
          eroiEl.style.color = (engine.inventory.wood > 0) ? "#2ecc71" : "#e74c3c";
      }
      
      const month = Math.floor(engine.day / 30) + 1;
      const dayOfMonth = (engine.day % 30) + 1;
      uiDate.textContent = `Ano ${engine.year}, Mês ${month}, Dia ${dayOfMonth}`;
      
      uiSeverity.textContent = Math.floor(engine.severity) + '%';
      uiDNA.textContent = numFormat.format(engine.adaptationPoints);
      uiEra.textContent = engine.currentEra.name;
      
      const fEntries = Object.entries(engine.globalDemographics.factions).sort((a, b) => b[1] - a[1]);
      let domFac = 'Tribal';
      let maxPop = 0;
      for (const [fac, count] of fEntries) {
          if (count > maxPop) { maxPop = count; domFac = fac; }
      }
      const domData = FactionsData.getFaction(domFac);
      uiFaction.textContent = domData.name;
      
      // --- Tarefas 44 e 45: Telas Finais (Vitória e Derrota) ---
      if (engine.gameWon) {
          engine.pause();
          const gameOverScreen = document.getElementById('loading-screen');
          gameOverScreen.style.display = 'flex';
          gameOverScreen.innerHTML = `
              <div style="text-align:center; padding: 40px; background: rgba(0,0,0,0.8); border: 2px solid #00ff88; border-radius: 10px;">
                  <h1 style="color:#00ff88; font-size:48px;">TRANSCENDÊNCIA</h1>
                  <p style="font-size:24px;">A Arca Geracional foi lançada. A humanidade escapou do Grande Filtro.</p>
                  <p style="font-size:18px; color:#aaa;">O motor rodou por ${engine.year} anos.</p>
                  <button id="btn-restart" style="margin-top:20px; padding: 10px 20px; font-size:18px; cursor:pointer;">Nova Simulação</button>
              </div>
          `;
          document.getElementById('btn-restart').onclick = () => location.reload();
          return;
      } else if (engine.globalPop === 0 && engine.year > 1) {
          engine.pause();
          const gameOverScreen = document.getElementById('loading-screen');
          gameOverScreen.style.display = 'flex';
          gameOverScreen.innerHTML = `
              <div style="text-align:center; padding: 40px; background: rgba(0,0,0,0.8); border: 2px solid #ff4444; border-radius: 10px;">
                  <h1 style="color:#ff4444; font-size:48px;">O GRANDE FILTRO VENCEU</h1>
                  <p style="font-size:24px;">A humanidade foi extinta. O planeta Terra respira novamente.</p>
                  <p style="font-size:18px; color:#aaa;">Sobreviveram por ${engine.year} anos antes do colapso sistêmico.</p>
                  <button id="btn-restart" style="margin-top:20px; padding: 10px 20px; font-size:18px; cursor:pointer;">Tentar Novamente</button>
              </div>
          `;
          document.getElementById('btn-restart').onclick = () => location.reload();
          return;
      }
      
      if (uiInvMinerals) uiInvMinerals.textContent = numFormat.format(Math.floor(engine.inventory.minerals || 0));
      if (uiInvSilicon) uiInvSilicon.textContent = numFormat.format(Math.floor(engine.inventory.silicon || 0));
      if (uiInvChips) uiInvChips.textContent = numFormat.format(Math.floor(engine.inventory.chips || 0));
      if (uiInvComputers) uiInvComputers.textContent = numFormat.format(Math.floor(engine.inventory.computers || 0));
      if (uiInvWood) uiInvWood.textContent = numFormat.format(Math.floor(engine.inventory.wood || 0));
      if (uiInvSteel) uiInvSteel.textContent = numFormat.format(Math.floor(engine.inventory.steel || 0));
      
      const controlDeckEl = document.getElementById('control-deck');
      if (controlDeckEl && !controlDeckEl.classList.contains('hidden')) {
          if (activeTabId === 'tab-tech') renderTechList();
          else if (activeTabId === 'tab-industry') renderIndustryList();
          else if (activeTabId === 'tab-factions') renderFactionsList();
      }
      
      // Atualiza os painéis mensais/anuais da classe UIManager
      uiManagerInstance.update();

      renderer.update();
      if (selectedCountryId) updateSidebar(engine.nodes.get(selectedCountryId));
    };
});

// Controls
btnPlayPause.addEventListener('click', () => {
  if (engine.isRunning) {
    engine.pause();
    btnPlayPause.innerHTML = '⏸️';
    btnPlayPause.style.background = '#6b2e2e';
    document.body.classList.remove('game-running');
  } else {
    if (engine.globalPop === 0) {
      alert("Clique no mapa para criar a primeira tribo!");
      return;
    }
    engine.play();
    btnPlayPause.innerHTML = '▶️';
    btnPlayPause.style.background = '#2d6b35';
    document.body.classList.add('game-running');
  }
});

speedBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    speedBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    engine.setSpeed(parseInt(e.target.dataset.speed));
  });
});

// Creator's Control Deck (Abas Unificadas e Menus de Navegação)
document.getElementById('btn-world').onclick = () => toggleDeck('tab-monitor');
document.getElementById('btn-wisdom').onclick = () => toggleDeck('tab-tech');
document.getElementById('btn-industry').onclick = () => toggleDeck('tab-industry');
document.getElementById('btn-factions').onclick = () => toggleDeck('tab-factions');
document.getElementById('btn-policies').onclick = () => toggleDeck('tab-policies');
document.getElementById('btn-godmode').onclick = () => toggleDeck('tab-god');
document.getElementById('btn-disasters').onclick = () => toggleDeck('tab-disasters');

// Botão de fechar do Control Deck
const closeDeckBtn = document.getElementById('btn-close-deck');
if (closeDeckBtn) {
    closeDeckBtn.onclick = () => {
        document.getElementById('control-deck').classList.add('hidden');
    };
}

// Botões seletores superiores de abas no próprio console
document.querySelectorAll('.deck-tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
});

// Botão de exportação dinâmica de saves
const exportSaveBtn = document.getElementById('btn-export-save');
if (exportSaveBtn) {
    exportSaveBtn.onclick = () => {
        uiManagerInstance.exportForensicJSON();
    };
}

// Políticas Públicas
document.getElementById('btn-policy-forest').addEventListener('click', (e) => {
    engine.policies.forest = !engine.policies.forest;
    e.target.textContent = engine.policies.forest ? 'Desativar' : 'Ativar';
    e.target.style.background = engine.policies.forest ? '#e74c3c' : '#2d6b35';
});
document.getElementById('btn-policy-water').addEventListener('click', (e) => {
    engine.policies.water = !engine.policies.water;
    e.target.textContent = engine.policies.water ? 'Desativar' : 'Ativar';
    e.target.style.background = engine.policies.water ? '#e74c3c' : '#2d6b35';
});

document.getElementById('btn-god-food').addEventListener('click', () => {
    if (!selectedCountryId) {
        showFloatText("Nenhuma região selecionada!", "#ff4444");
        return;
    }
    const node = engine.nodes.get(selectedCountryId);
    if (!node) return;
    const cost = 15;
    if (engine.adaptationPoints < cost) {
        showFloatText("DNA Insuficiente!", "#ff4444");
        return;
    }
    engine.adaptationPoints -= cost;
    node.food = (node.food || 0) + 10000;
    uiDNA.textContent = numFormat.format(engine.adaptationPoints);
    showFloatText("🍞 Rações Divinas Entregues!", "#2ecc71");
    updateSidebar(node);
});

document.getElementById('btn-god-water').addEventListener('click', () => {
    if (!selectedCountryId) {
        showFloatText("Nenhuma região selecionada!", "#ff4444");
        return;
    }
    const node = engine.nodes.get(selectedCountryId);
    if (!node) return;
    const cost = 15;
    if (engine.adaptationPoints < cost) {
        showFloatText("DNA Insuficiente!", "#ff4444");
        return;
    }
    engine.adaptationPoints -= cost;
    if (!node.resources) node.resources = {};
    node.resources.water = (node.resources.water || 0) + 20000;
    uiDNA.textContent = numFormat.format(engine.adaptationPoints);
    showFloatText("💧 Aquífero Sagrado Abastecido!", "#00ddff");
    updateSidebar(node);
});

document.getElementById('btn-god-pop').addEventListener('click', () => {
    if (!selectedCountryId) {
        showFloatText("Nenhuma região selecionada!", "#ff4444");
        return;
    }
    const node = engine.nodes.get(selectedCountryId);
    if (!node) return;
    if (!node.infected) {
        showFloatText("Região não habitada!", "#ff4444");
        return;
    }
    const cost = 30;
    if (engine.adaptationPoints < cost) {
        showFloatText("DNA Insuficiente!", "#ff4444");
        return;
    }
    engine.adaptationPoints -= cost;
    node.demographics.total += 50;
    engine.globalPop += 50;
    uiDNA.textContent = numFormat.format(engine.adaptationPoints);
    showFloatText("🌱 População Abençoada!", "#f1c40f");
    updateSidebar(node);
    renderer.update();
});

document.getElementById('btn-god-cure').addEventListener('click', () => {
    if (!selectedCountryId) {
        showFloatText("Nenhuma região selecionada!", "#ff4444");
        return;
    }
    const node = engine.nodes.get(selectedCountryId);
    if (!node) return;
    const cost = 40;
    if (engine.adaptationPoints < cost) {
        showFloatText("DNA Insuficiente!", "#ff4444");
        return;
    }
    engine.adaptationPoints -= cost;
    node.famineDays = 0;
    if (node.sir) {
        node.sir.infected = 0;
        node.sir.active = false;
    }
    uiDNA.textContent = numFormat.format(engine.adaptationPoints);
    showFloatText("🦠 Fome e Pragas Expurgadas!", "#9b59b6");
    updateSidebar(node);
});

// Map Layers
const layerBtns = [
    document.getElementById('btn-layer-base'),
    document.getElementById('btn-layer-water'),
    document.getElementById('btn-layer-climate')
];
layerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        layerBtns.forEach(b => b.style.background = '#111');
        e.currentTarget.style.background = '#444';
        renderer.activeLayer = e.currentTarget.id.split('-')[2]; // 'base', 'water', 'climate'
        renderer.update();
    });
});

function updateSidebar(node) {
  if (!node) return;
  if (panelCountry) panelCountry.classList.remove('hidden');
  
  const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
  };
  const setStyle = (id, prop, val) => {
      const el = document.getElementById(id);
      if (el) el.style[prop] = val;
  };

  setTxt('info-name', node.name);

  // Sincroniza dinamicamente o nome na aba de Poderes de DNA
  setTxt('god-selected-region-name', node.name);
  setTxt('info-biome', node.biome ? node.biome.name : '-');
  
  // Status
  setTxt('info-status', node.infected ? "Habitado" : "Selvagem");
  setStyle('info-status', 'color', node.infected ? "#00ff88" : "#aaa");

  // Capacidade e População
  setTxt('info-pop', numFormat.format(Math.floor(node.demographics.total)));
  setTxt('info-cap', numFormat.format(node.capacity));
  
  const bar = document.getElementById('info-pop-bar');
  const ratio = Math.min(100, (node.demographics.total / node.capacity) * 100);
  if (bar) {
      bar.style.width = `${ratio}%`;
      bar.style.background = ratio > 90 ? '#ff4444' : (ratio > 50 ? '#ffaa00' : '#00ff88');
  }

  // Recursos Naturais Locais
  const biomeId = node.biome ? node.biome.id : 'generic';
  setTxt('label-wood', `🌲 ${ResourceDictionary.getLocalizedName('wood', biomeId)}`);
  setTxt('label-water', `💧 ${ResourceDictionary.getLocalizedName('water', biomeId)}`);
  setTxt('label-minerals', `🪨 ${ResourceDictionary.getLocalizedName('minerals', biomeId)}`);

  if (node.resources) {
      setTxt('info-wood', numFormat.format(Math.floor(node.resources.wood || 0)));
      setTxt('info-water', numFormat.format(Math.floor(node.resources.water || 0)));
      setTxt('info-minerals', numFormat.format(Math.floor(node.resources.minerals || 0)));
      setTxt('info-soil', `${Math.floor(node.soil || 100)}%`);
      
      const soilEl = document.getElementById('info-soil');
      if (soilEl) {
          if (node.soil < 50) soilEl.style.color = '#ffaa00';
          if (node.soil < 20) soilEl.style.color = '#ff4444';
      }
  } else {
      setTxt('info-wood', '0');
      setTxt('info-water', '0');
      setTxt('info-minerals', '0');
      setTxt('info-soil', '100%');
  }
  
  // Fatores de Risco Sistêmicos (Global)
  if (engine.pressures) {
      setTxt('risk-tectonic', `${(engine.pressures.tectonic * 1000).toFixed(1)}%`);
      setTxt('risk-climatic', `${(engine.pressures.climatic * 1000).toFixed(1)}%`);
      setTxt('risk-biological', `${(engine.pressures.biological * 1000).toFixed(1)}%`);
      setTxt('risk-social', `${(engine.pressures.social * 1000).toFixed(1)}%`);
  }

  // Facções Locais
  const fList = document.getElementById('info-factions-list');
  if (fList) {
      fList.innerHTML = '';
      if (node.infected && node.demographics && node.demographics.dist && node.demographics.dist.factions) {
          const entries = Object.entries(node.demographics.dist.factions).sort((a,b) => b[1] - a[1]);
          for (const [fac, percentage] of entries) {
              if (percentage < 0.01) continue; // Ignora se for menos de 1%
              const count = Math.floor(percentage * node.demographics.total);
              const facData = FactionsData.getFaction(fac);
              const row = document.createElement('div');
              row.style.display = 'flex';
              row.style.justifyContent = 'space-between';
              row.style.padding = '4px 0';
              row.style.borderBottom = '1px solid #333';
              row.innerHTML = `<span style="color:${facData.baseColor}; font-weight:bold;">🎭 ${facData.name}</span> <span>👥 ${numFormat.format(count)}</span>`;
              fList.appendChild(row);
          }
      } else {
          fList.innerHTML = '<div style="color:#666; padding:10px;">Nenhuma atividade detectada.</div>';
      }
  }
}

// ==========================================
// Sistema Operacional: Janelas Arrastáveis
// ==========================================
function makeDraggable(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const handle = modal.querySelector('.modal-header') || modal.querySelector('.deck-header') || modal; // Usa o header correspondente, ou o próprio modal se não tiver
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    handle.style.cursor = 'grab';

    handle.addEventListener('mousedown', (e) => {
        // Não arrastar se clicar no botão de fechar
        if (e.target.classList.contains('close-btn') || e.target.classList.contains('deck-close-btn')) return;
        
        isDragging = true;
        handle.style.cursor = 'grabbing';
        
        // Converte o translate(-50%, -50%) nativo do CSS em pixels absolutos para não pular
        const rect = modal.getBoundingClientRect();
        modal.style.transform = 'none';
        modal.style.left = rect.left + 'px';
        modal.style.top = rect.top + 'px';

        startX = e.clientX;
        startY = e.clientY;
        initialLeft = rect.left;
        initialTop = rect.top;
        
        // Traz a janela focada para frente
        document.querySelectorAll('.modal, .control-deck, .stone-panel').forEach(m => m.style.zIndex = 100);
        modal.style.zIndex = 101;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        modal.style.left = (initialLeft + dx) + 'px';
        modal.style.top = (initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        handle.style.cursor = 'grab';
    });
}

// Inicializa o drag em todas as guias
makeDraggable('control-deck');
makeDraggable('country-info');
makeDraggable('instructions');

// Modo Espectador Cósmico (Tarefa 49)
let cosmicMode = false;
document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'h') {
        cosmicMode = !cosmicMode;
        document.querySelectorAll('.stone-panel, .floating-toolbar, #resource-bar').forEach(el => {
            el.style.display = cosmicMode ? 'none' : '';
        });
        showFloatText(cosmicMode ? '🌌 Modo Espectador Ativado' : '🌌 UI Restaurada', '#00ff88');
    }
});
