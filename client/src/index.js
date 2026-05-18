import { GameEngine } from './core/Engine.js';
import { MapRenderer } from './ui/MapRenderer.js';
import { FactionsData } from './core/FactionsData.js';
import { ResourceDictionary } from './core/ResourceDictionary.js';

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

function showFloatText(msg, color) {
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.style.color = color || '#00ff88';
    toast.textContent = msg;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

renderer.init().then(() => {
    const loadingScreen = document.getElementById('loading-screen');
    const godPanel = document.getElementById('god-panel');
    const valWar = document.getElementById('val-war');
    const valDisaster = document.getElementById('val-disaster');
    const valTech = document.getElementById('val-tech');

    document.getElementById('config-war').oninput = (e) => valWar.textContent = e.target.value + '%';
    document.getElementById('config-disaster').oninput = (e) => valDisaster.textContent = e.target.value + '%';
    document.getElementById('config-tech').oninput = (e) => valTech.textContent = e.target.value + 'x';

    if (loadingScreen) loadingScreen.style.display = 'none';
    if (godPanel) godPanel.style.display = 'flex';

    document.getElementById('btn-start-universe').onclick = () => {
        engine.config.warChance = parseInt(document.getElementById('config-war').value) / 100.0;
        engine.config.disasterThreshold = parseInt(document.getElementById('config-disaster').value);
        engine.config.techCostMultiplier = parseFloat(document.getElementById('config-tech').value);
        
        godPanel.style.display = 'none';
        showFloatText('🌎 Universo Configurado!', '#00ddff');
    };

    const newsFeed = document.getElementById('news-feed-list');
    function addNews(msg, color) {
        const item = document.createElement('div');
        item.style.color = color;
        item.style.paddingBottom = '3px';
        item.style.borderBottom = '1px dashed #333';
        item.textContent = msg;
        newsFeed.prepend(item);
        if (newsFeed.children.length > 8) newsFeed.lastChild.remove();
    }

    engine.onEvent = (data, type) => {
        if (type === "disaster") {
            addNews(data.message || data, '#ff4444');
            showFloatText(data.message || data, '#ff4444');
        } else if (type === "war") {
            addNews(data.message || data, '#ff7700');
            showFloatText("⚔️ GUERRA", '#ff7700');
        } else if (type === "trade") {
            addNews(data.message || data, '#f1c40f'); // Dourado
            showFloatText("🚢 COMÉRCIO", '#f1c40f');
            if (data.sourceId) renderer.animateBlink(data.sourceId, '#f1c40f');
            if (data.targetId) renderer.animateBlink(data.targetId, '#f1c40f');
            // Animar o pacote voando
            renderer.animateMigration(data);
        } else if (type === "tech_auto") {
            showFloatText(`💡 Evolução: ${data}`, '#00ddff');
            if (!document.getElementById('tech-modal').classList.contains('hidden')) renderTechList();
        } else if (type === "bubble_spawn") {
            renderer.spawnBubble(data);
        } else if (type === "migration_event") {
            renderer.animateMigration(data);
        }
    };

    engine.onTick = () => {
      uiGlobalPop.textContent = numFormat.format(engine.globalPop);
      
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
      uiFaction.style.color = domData.baseColor;
      
      if (engine.severity < 30) uiSeverity.style.color = '#fff';
      else if (engine.severity < 60) uiSeverity.style.color = '#ffaa00';
      else uiSeverity.style.color = '#ff4444';
      
      // Atualizar Inventário Global
      uiInvWood.textContent = numFormat.format(engine.inventory.wood || 0);
      uiInvMinerals.textContent = numFormat.format(engine.inventory.minerals || 0);
      uiInvSteel.textContent = numFormat.format(engine.inventory.steel || 0);
      uiInvSilicon.textContent = numFormat.format(engine.inventory.silicon || 0);
      uiInvChips.textContent = numFormat.format(engine.inventory.chips || 0);
      uiInvComputers.textContent = numFormat.format(engine.inventory.computers || 0);
      
      // Atualiza modais se estiverem abertos
      if (!document.getElementById('tech-modal').classList.contains('hidden')) renderTechList();
      if (!document.getElementById('industry-modal').classList.contains('hidden')) renderIndustryList();
      if (!document.getElementById('factions-modal').classList.contains('hidden')) renderFactionsList();
      
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

function updateSidebar(node) {
  if (!node) return;
  panelCountry.classList.remove('hidden');
  document.getElementById('info-name').textContent = node.name;
  document.getElementById('info-biome').textContent = node.biome ? node.biome.name : '-';
  
  // Status
  const statusEl = document.getElementById('info-status');
  statusEl.textContent = node.infected ? "Habitado" : "Selvagem";
  statusEl.style.color = node.infected ? "#00ff88" : "#aaa";

  // Capacidade e População
  document.getElementById('info-pop').textContent = numFormat.format(Math.floor(node.demographics.total));
  document.getElementById('info-cap').textContent = numFormat.format(node.capacity);
  
  const bar = document.getElementById('info-pop-bar');
  const ratio = Math.min(100, (node.demographics.total / node.capacity) * 100);
  bar.style.width = `${ratio}%`;
  bar.style.background = ratio > 90 ? '#ff4444' : (ratio > 50 ? '#ffaa00' : '#00ff88');

  // Recursos Naturais Locais
  const biomeId = node.biome ? node.biome.id : 'generic';
  document.getElementById('label-wood').textContent = `🌲 ${ResourceDictionary.getLocalizedName('wood', biomeId)}`;
  document.getElementById('label-water').textContent = `💧 ${ResourceDictionary.getLocalizedName('water', biomeId)}`;
  document.getElementById('label-minerals').textContent = `🪨 ${ResourceDictionary.getLocalizedName('minerals', biomeId)}`;

  if (node.resources) {
      document.getElementById('info-wood').textContent = numFormat.format(Math.floor(node.resources.wood || 0));
      document.getElementById('info-water').textContent = numFormat.format(Math.floor(node.resources.water || 0));
      document.getElementById('info-minerals').textContent = numFormat.format(Math.floor(node.resources.minerals || 0));
  } else {
      document.getElementById('info-wood').textContent = 0;
      document.getElementById('info-water').textContent = 0;
      document.getElementById('info-minerals').textContent = 0;
  }

  // Facções Locais
  const fList = document.getElementById('info-factions-list');
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

// ==========================================
// Sistema Operacional: Janelas Arrastáveis
// ==========================================
function makeDraggable(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const handle = modal.querySelector('.modal-header') || modal; // Usa o header, ou o próprio modal se não tiver
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    handle.style.cursor = 'grab';

    handle.addEventListener('mousedown', (e) => {
        // Não arrastar se clicar no botão de fechar
        if (e.target.classList.contains('close-btn')) return;
        
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
        document.querySelectorAll('.modal').forEach(m => m.style.zIndex = 100);
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
makeDraggable('tech-modal');
makeDraggable('industry-modal');
makeDraggable('factions-modal');
makeDraggable('country-info');
makeDraggable('instructions');
