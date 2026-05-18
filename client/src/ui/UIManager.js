/**
 * UIManager — Componentes visuais de interface do CROM.
 * 
 * 068. Ícones de Causa/Efeito no terminal de eventos
 * 069. Chronicle Panel — Histórico rolável dos últimos 50 eventos
 * 070. Hex Flash — Destaque visual quando eventos diplomáticos acontecem
 * 071. Painel Fatores de Risco — Probabilidades acumuladas por território
 * 072. Painel de Biomas — Clicar no hex lista recursos
 * 073. Raio-X Demográfico — Gráfico de pizza com facções
 * 074. Indicadores Visuais de Desastre — Ícones piscantes
 * 078. Gráfico Hockey Stick — Plota população ao longo dos séculos
 * 079. Painel EROI Global — Barra de energia
 * 080. Filtro Sepia para Dark Age — Tela fica fria quando tech é perdida
 * 081. Histórico Forense JSON — Botão exportar
 * 082. Pause Automático por Extinção — Pausa se 5% pop sumir
 * 083. Cemitério de Civilizações — localStorage persistente
 */
export class UIManager {
    static injectCoreUI() {
        if (typeof document === 'undefined') return;
        
        // Se já foi injetado, ignora
        if (document.getElementById('global-hud')) return;

        const uiHTML = `
        <!-- HUD Global Compacto (Topo Direita) -->
        <div id="global-hud" class="stone-panel hud-box" style="top: 10px; right: 10px; left: auto; flex-direction: row; flex-wrap: wrap; width: 350px; max-width: 45%; justify-content: space-between; font-size: 14px; padding: 5px 10px; z-index: 90;">
            <div class="hud-item" style="width: 45%;"><span class="icon" title="Data do Jogo">📅</span> <span id="game-date">Ano 1, Mês 1</span></div>
            <div class="hud-item" style="width: 45%;"><span class="icon" title="População Mundial">👥</span> <span id="global-pop">0</span></div>
            <div class="hud-item" style="width: 45%;"><span class="icon" title="Severidade Planetária">⚠️</span> <span id="global-severity" style="color:#ff4444;">0%</span></div>
            <div class="hud-item" style="width: 45%;"><span class="icon" title="Pontos de DNA">🧬</span> <span id="global-dna" style="color:#f1c40f;">0</span></div>
            <div class="hud-item" style="width: 100%; text-align: center; border-top: 1px solid #333; margin-top: 5px; padding-top: 5px;">
                <span class="icon" title="Era Tecnológica">⏳</span> <span id="game-era" style="color:#00ddff; font-weight:bold;">Idade da Pedra</span> | 
                <span class="icon" title="Facção Dominante">👑</span> <span id="dominant-faction">-</span>
            </div>
        </div>

        <!-- Recursos Globais (Topo Esquerda) -->
        <div id="inventory-hud" class="stone-panel hud-box" style="top: 10px; left: 10px; right: auto; flex-direction: row; flex-wrap: wrap; max-width: 50%; gap: 10px; padding: 5px 10px; font-size: 16px; z-index: 90;">
            <div class="hud-item" style="color: #6ab04c;"><span class="icon" title="Madeira">🌲</span> <span id="inv-wood">0</span></div>
            <div class="hud-item" style="color: #e3c16f;"><span class="icon" title="Minérios">🪨</span> <span id="inv-minerals">0</span></div>
            <div class="hud-item" style="color: #aaa;"><span class="icon" title="Aço">⛓️</span> <span id="inv-steel">0</span></div>
            <div class="hud-item" style="color: #00ddff;"><span class="icon" title="Chips">💻</span> <span id="inv-chips">0</span></div>
            <div class="hud-item" style="color: #ffaa00; font-weight: bold; border-left: 1px solid #333; padding-left: 10px;"><span class="icon" title="Retorno Energético (EROI)">⚙️ EROI:</span> <span id="inv-eroi">100%</span></div>
        </div>

        <!-- Log de Eventos / Feed de Notícias -->
        <div id="news-feed-panel" class="stone-panel hud-box" style="right: 20px; top: 380px; width: 300px; max-height: 200px; overflow-y: hidden; pointer-events: none; opacity: 0.85; background: rgba(5, 10, 20, 0.9);">
            <div style="font-size: 14px; color: #00ddff; text-align: center; margin-bottom: 5px; border-bottom: 1px solid #333; padding-bottom: 2px;">NOTÍCIAS GLOBAIS</div>
            <div id="news-feed-list" style="font-size: 14px; display: flex; flex-direction: column; gap: 5px; line-height: 1.2;"></div>
        </div>

        <!-- Modal de Ecologia / Mundo -->
        <div id="world-modal" class="stone-panel modal hidden" style="left: auto; right: 20px; top: auto; bottom: 100px; transform: none; width: 300px;">
            <div class="modal-header">
                <h2>🌍 Ecologia e Lentes</h2>
                <button class="close-btn" onclick="document.getElementById('world-modal').classList.add('hidden')">✖</button>
            </div>
            <div class="list-container">
                <button id="btn-layer-base" class="layer-btn active" style="width: 100%; text-align: left; background: #444; color: #fff; border: 1px solid #333; padding: 5px; cursor: pointer; margin-bottom: 5px;">🌍 Biomas Base</button>
                <button id="btn-layer-water" class="layer-btn" style="width: 100%; text-align: left; background: #111; color: #fff; border: 1px solid #333; padding: 5px; cursor: pointer; margin-bottom: 5px;">💧 Aquífero (Água)</button>
                <button id="btn-layer-climate" class="layer-btn" style="width: 100%; text-align: left; background: #111; color: #fff; border: 1px solid #333; padding: 5px; cursor: pointer; margin-bottom: 5px;">🌡️ Clima (Emissões)</button>
            </div>
        </div>

        <!-- Modais de Interface -->
        <div id="disasters-modal" class="stone-panel modal hidden" style="left: auto; right: 20px; top: auto; bottom: 100px; transform: none; width: 300px;">
            <div class="modal-header">
                <h2>🔥 Menu da Destruição</h2>
                <button class="close-btn" onclick="document.getElementById('disasters-modal').classList.add('hidden')">✖</button>
            </div>
            <div class="list-container" style="text-align: center; color: #aaa; padding: 15px;">
                <p>Nenhuma anomalia manual desbloqueada ainda. (A Fúria do Planeta age autonomamente).</p>
                <button class="item-action-btn" style="width: 100%; border-color: #801a15; background: #c4302b;" onclick="alert('Destruição manual em breve!')">☄️ Lançar Meteoro Aleatório</button>
            </div>
        </div>

        <div id="tech-modal" class="stone-panel modal hidden">
            <div class="modal-header">
                <h2>🧬 Árvore da Sabedoria</h2>
                <button class="close-btn" onclick="document.getElementById('tech-modal').classList.add('hidden')">✖</button>
            </div>
            <div id="tech-list" class="grid-list"></div>
        </div>

        <div id="industry-modal" class="stone-panel modal hidden">
            <div class="modal-header">
                <h2>⚙️ Complexo Industrial</h2>
                <button class="close-btn" onclick="document.getElementById('industry-modal').classList.add('hidden')">✖</button>
            </div>
            <div id="recipe-list" class="grid-list"></div>
        </div>

        <div id="factions-modal" class="stone-panel modal hidden">
            <div class="modal-header">
                <h2>👁️ Tensões e Facções</h2>
                <button class="close-btn" onclick="document.getElementById('factions-modal').classList.add('hidden')">✖</button>
            </div>
            <div id="factions-list" class="list-container"></div>
        </div>
        
        <div id="policies-modal" class="stone-panel modal hidden">
            <div class="modal-header">
                <h2>📜 Políticas Públicas (Governança)</h2>
                <button class="close-btn" onclick="document.getElementById('policies-modal').classList.add('hidden')">✖</button>
            </div>
            <div class="list-container" style="display: flex; flex-direction: column; gap: 10px;">
                <div class="hud-item" style="justify-content: space-between; padding: 10px; border: 1px solid #555;">
                    <div>
                        <strong style="color: #2ecc71;">🌲 Reflorestamento Ativo</strong>
                        <div style="font-size: 12px; color: #888;">Gasta mão de obra para plantar lenha e resfriar o planeta. (-20% K)</div>
                    </div>
                    <button id="btn-policy-forest" class="item-action-btn" style="width: 80px;">Ativar</button>
                </div>
                <div class="hud-item" style="justify-content: space-between; padding: 10px; border: 1px solid #555;">
                    <div>
                        <strong style="color: #3498db;">💧 Racionamento Hídrico</strong>
                        <div style="font-size: 12px; color: #888;">Reduz o consumo de água, mas causa tensão social. (+30% Atrito)</div>
                    </div>
                    <button id="btn-policy-water" class="item-action-btn" style="width: 80px;">Ativar</button>
                </div>
            </div>
        </div>
        
        <!-- Info Local (Lupa de Inspeção) -->
        <div id="country-info" class="stone-panel modal hidden" style="width: 380px;">
            <div class="modal-header">
                <h2 id="info-name" style="font-size: 26px;">Local</h2>
                <button class="close-btn" onclick="document.getElementById('country-info').classList.add('hidden')">✖</button>
            </div>
            
            <div style="padding: 10px; border-bottom: 2px solid #222;">
                <h2 id="info-name" style="color:#00ddff; font-size:24px; margin-bottom:10px;">Região</h2>
                <div style="font-size: 14px; line-height: 1.6;">
                    <div><strong>Bioma:</strong> <span id="info-biome">-</span></div>
                    <span id="info-status">Vazio</span>
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 18px; color: #aaa;">
                    <span>Capacidade:</span>
                    <span>👥 <span id="info-pop">0</span> / <span id="info-cap">0</span></span>
                </div>
                <!-- Barra de Superlotação -->
                <div style="width: 100%; height: 6px; background: #222; margin-top: 5px; border-radius:3px;">
                    <div id="info-pop-bar" style="height: 100%; width: 0%; background: #00ff88; transition: width 0.3s; border-radius:3px;"></div>
                </div>
            </div>
            
            <div style="padding: 10px;">
                <h3 style="font-size: 16px; color: #888; margin-bottom: 5px;">Recursos Naturais</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 18px;">
                    <div><span id="label-wood">🌲 Madeira</span>: <span id="info-wood" style="color:#00ff88;">0</span></div>
                    <div><span id="label-water">💧 Água</span>: <span id="info-water" style="color:#00ddff;">0</span></div>
                    <div><span id="label-minerals">🪨 Minérios</span>: <span id="info-minerals" style="color:#ffaa00;">0</span></div>
                    <div><span id="label-soil">🌱 Solo</span>: <span id="info-soil" style="color:#2ecc71;">100%</span></div>
                </div>
            <div style="padding: 10px; background: #1a1a1a;">
                <h3 style="font-size: 16px; color: #ffaa00; margin-bottom: 5px;">Fatores de Risco Sistêmicos (Globais)</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 14px;">
                    <div>🌋 Tectônico: <span id="risk-tectonic" style="color:#ff4444;">0%</span></div>
                    <div>🌡️ Climático: <span id="risk-climatic" style="color:#ff4444;">0%</span></div>
                    <div>🦠 Biológico: <span id="risk-biological" style="color:#ff4444;">0%</span></div>
                    <div>🔥 Social: <span id="risk-social" style="color:#ff4444;">0%</span></div>
                </div>
            </div>
            
            <div style="padding: 5px 10px; background: #222;">
                <span style="font-size: 16px; color: #888;">TENSÕES LOCAIS (FACÇÕES)</span>
            </div>
            <div id="info-factions-list" class="list-container" style="max-height: 200px; overflow-y: auto;">
                <!-- Preenchido via JS -->
            </div>
        </div>

        <!-- Instruções Iniciais -->
        <div id="instructions" class="stone-panel" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 450px; text-align: center; padding: 10px; z-index: 100; pointer-events: none;">
            <h2 style="color: #e0d0a0; margin: 0;">CROM: A Semente</h2>
            <p style="margin: 5px 0; font-size: 20px;">Clique em qualquer região continental no mapa para depositar a Tribo Primordial.</p>
        </div>

        <!-- Toasts -->
        <div id="toast-container" style="position: absolute; top: 100px; left: 50%; transform: translateX(-50%); z-index: 1000; text-align: center;"></div>

        <!-- Caixa de Ferramentas Base (Bottom Toolbar) -->
        <div id="bottom-toolbar" class="stone-panel">
            <button class="tool-btn" id="btn-play-pause" title="Play/Pause" style="background: #6b2e2e;">⏸️</button>
            <div style="display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 0 5px;">
                <button class="speed-btn active" data-speed="1">1x</button>
                <button class="speed-btn" data-speed="3">3x</button>
                <button class="speed-btn" data-speed="5">5x</button>
            </div>
            <div style="width: 2px; background: #222; margin: 0 5px;"></div>
            <button class="tool-btn" id="btn-world" title="Mundo">🌍</button>
            <button class="tool-btn" id="btn-factions" title="Facções">🎭</button>
            <button class="tool-btn" id="btn-wisdom" title="Sabedoria">🧬</button>
            <button class="tool-btn" id="btn-industry" title="Indústria">⚙️</button>
            <button class="tool-btn" id="btn-disasters" title="Destruição">🔥</button>
            <button class="tool-btn" id="btn-policies" title="Políticas">📜</button>
        </div>
        
        <!-- Tooltip -->
        <div id="tooltip" class="stone-panel hidden" style="position: absolute; pointer-events: none; z-index: 999; padding: 5px; font-size: 16px;"></div>
        `;
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.insertAdjacentHTML('beforeend', uiHTML);
        }
    }
    constructor(engine, mapRenderer) {
        this.engine = engine;
        this.mapRenderer = mapRenderer;
        this.popHistory = [];
        this.maxHistory = 500; // 500 anos de dados
        this.lastPop = 0;
        this.darkAgeActive = false;
        this.cemetery = this.loadCemetery();
        
        this.initPanels();
    }
    
    initPanels() {
        // Cria container de painéis se não existir
        if (typeof document === 'undefined') return;
        
        let container = document.getElementById('ui-panels');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ui-panels';
            container.style.cssText = 'position:fixed;top:0;right:0;width:320px;height:100vh;overflow-y:auto;pointer-events:none;z-index:100;';
            document.body.appendChild(container);
        }
        
        // 069. Chronicle Panel
        this.createChroniclePanel(container);
        // 073. Demographics Panel
        this.createDemographicsPanel(container);
        // 078. Hockey Stick Graph
        this.createPopGraphPanel(container);
        // 079. EROI Panel
        this.createEROIPanel(container);
        // NOVO: Climate Panel
        this.createClimatePanel(container);
        // 083. Cemetery Panel
        this.createCemeteryPanel(container);
    }
    
    // =============================================
    // 069. Chronicle Panel — Últimos 50 eventos
    // =============================================
    createChroniclePanel(container) {
        const panel = document.createElement('div');
        panel.id = 'chronicle-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;max-height:200px;overflow-y:auto;border:1px solid #333;';
        panel.innerHTML = '<div style="color:#ffaa00;font-weight:bold;margin-bottom:5px;">📜 CRÔNICA</div><div id="chronicle-list"></div>';
        container.appendChild(panel);
    }
    
    updateChronicle() {
        const list = document.getElementById('chronicle-list');
        if (!list || !this.engine.chronicle) return;
        
        const recent = this.engine.chronicle.slice(-30).reverse();
        // 068. Ícones de Causa/Efeito
        list.innerHTML = recent.map(e => {
            const icon = this.getEventIcon(e.type);
            return `<div style="padding:2px 0;border-bottom:1px solid #222;">${icon} <span style="color:#888;">Ano ${e.year}</span> ${e.message}</div>`;
        }).join('');
    }
    
    // 068. Ícones por tipo de evento
    getEventIcon(type) {
        const icons = {
            'disaster': '💥', 'war': '⚔️', 'pandemic': '🦠', 'genocide': '💀',
            'kessler': '🛰️', 'singularity': '🤖', 'exhaustion': '⛏️',
            'simplification': '🏚️', 'piracy': '🏴‍☠️', 'economy': '💰',
            'hyperinflation': '📉', 'diplomacy': '🤝', 'rebirth': '🔄',
            'achievement': '🏆', 'milestone': '⭐', 'warning': '⚠️',
            'tech_auto': '🔬', 'nemesis': '👹'
        };
        return icons[type] || '📌';
    }
    
    // =============================================
    // 073. Demographics Panel — Pizza de facções
    // =============================================
    createDemographicsPanel(container) {
        const panel = document.createElement('div');
        panel.id = 'demographics-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;border:1px solid #333;display:none;';
        panel.innerHTML = '<div style="color:#3498db;font-weight:bold;margin-bottom:5px;">👥 DEMOGRAFIA</div><canvas id="demo-pie" width="150" height="150"></canvas><div id="demo-stats"></div>';
        container.appendChild(panel);
    }
    
    updateDemographics() {
        const panel = document.getElementById('demographics-panel');
        const canvas = document.getElementById('demo-pie');
        const stats = document.getElementById('demo-stats');
        if (!panel || !canvas || !stats) return;
        
        if (!this.engine.globalDemographics?.factions) return;
        panel.style.display = 'block';
        
        const factions = this.engine.globalDemographics.factions;
        const total = Object.values(factions).reduce((a, b) => a + b, 0);
        if (total <= 0) return;
        
        // Desenha pizza
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 150, 150);
        const cx = 75, cy = 75, r = 60;
        let startAngle = 0;
        
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#1abc9c', '#e67e22'];
        let i = 0;
        
        let statsHtml = '';
        for (const [fac, count] of Object.entries(factions)) {
            const pct = count / total;
            const endAngle = startAngle + pct * Math.PI * 2;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, endAngle);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            
            statsHtml += `<div><span style="color:${colors[i % colors.length]}">■</span> ${fac}: ${Math.floor(count).toLocaleString('pt-BR')} (${(pct * 100).toFixed(1)}%)</div>`;
            startAngle = endAngle;
            i++;
        }
        stats.innerHTML = statsHtml;
    }
    
    // =============================================
    // 071/072. Painel de Hex Info (Biomas + Riscos)
    // =============================================
    showHexInfo(node) {
        let panel = document.getElementById('hex-info-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'hex-info-panel';
            panel.style.cssText = 'position:fixed;left:10px;bottom:60px;background:rgba(0,0,0,0.9);color:#ddd;padding:12px;border-radius:8px;font-size:12px;z-index:200;min-width:220px;border:1px solid #444;';
            document.body.appendChild(panel);
        }
        
        const biome = node.biome?.id || 'unknown';
        const pop = node.demographics?.total || 0;
        const cap = node.capacity || 0;
        const ratio = cap > 0 ? (pop / cap * 100).toFixed(1) : 0;
        
        // 071. Fatores de Risco
        const risks = [];
        if (pop / cap > 0.8) risks.push('⚠️ Superlotação');
        if ((node.resources?.water || 0) < 1000) risks.push('💧 Seca');
        if ((node.resources?.wood || 0) < 500) risks.push('🪵 Desmatamento');
        if (node.sir?.active) risks.push('🦠 Pandemia ativa');
        if (node.veteranBuff > 0) risks.push('⚔️ Zona de conflito');
        
        panel.innerHTML = `
            <div style="color:#ffaa00;font-weight:bold;margin-bottom:5px;">📍 ${node.name || node.id}</div>
            <div>🌍 Bioma: <span style="color:#aaa">${biome}</span></div>
            <div>🧬 Adaptação: <span style="color:#9b59b6">${Math.floor(node.biomeAdaptation?.[biome] || 0)}%</span></div>
            <div>👥 Pop: <span style="color:#3498db">${pop.toLocaleString('pt-BR')}</span> / ${cap.toLocaleString('pt-BR')} (${ratio}%)</div>
            <div>🪵 Madeira: ${(node.resources?.wood || 0).toLocaleString('pt-BR')}</div>
            <div>💧 Água: ${(node.resources?.water || 0).toLocaleString('pt-BR')}</div>
            <div>⛏️ Minerais: ${(node.resources?.minerals || 0).toLocaleString('pt-BR')}</div>
            ${node.rareEarths ? `<div>💎 Terras Raras: ${node.rareEarths}</div>` : ''}
            ${node.aquiferDepth ? `<div>🕳️ Aquífero: ${node.aquiferDepth.toFixed(2)}m</div>` : ''}
            ${risks.length > 0 ? `<div style="margin-top:5px;color:#e74c3c;font-weight:bold;">RISCOS:</div>${risks.map(r => `<div>${r}</div>`).join('')}` : '<div style="color:#2ecc71;margin-top:3px;">✅ Sem riscos</div>'}
        `;
        panel.style.display = 'block';
    }
    
    hideHexInfo() {
        const panel = document.getElementById('hex-info-panel');
        if (panel) panel.style.display = 'none';
    }
    
    // =============================================
    // 078. Hockey Stick — Gráfico de pop ao longo do tempo
    // =============================================
    createPopGraphPanel(container) {
        const panel = document.createElement('div');
        panel.id = 'popgraph-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;border:1px solid #333;';
        panel.innerHTML = '<div style="color:#2ecc71;font-weight:bold;margin-bottom:5px;">📈 POPULAÇÃO</div><canvas id="pop-graph" width="280" height="80"></canvas>';
        container.appendChild(panel);
    }
    
    updatePopGraph() {
        // Registra 1 ponto por ano
        if (this.engine.day === 0) {
            this.popHistory.push(this.engine.globalPop);
            if (this.popHistory.length > this.maxHistory) this.popHistory.shift();
        }
        
        const canvas = document.getElementById('pop-graph');
        if (!canvas || this.popHistory.length < 2) return;
        
        const ctx = canvas.getContext('2d');
        const w = 280, h = 80;
        ctx.clearRect(0, 0, w, h);
        
        const max = Math.max(...this.popHistory, 1);
        const step = w / (this.popHistory.length - 1);
        
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < this.popHistory.length; i++) {
            const x = i * step;
            const y = h - (this.popHistory[i] / max) * (h - 5);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#888';
        ctx.font = '9px monospace';
        ctx.fillText(`Peak: ${Math.max(...this.popHistory).toLocaleString('pt-BR')}`, 5, 12);
        ctx.fillText(`Atual: ${this.engine.globalPop.toLocaleString('pt-BR')}`, 5, h - 3);
    }
    
    // =============================================
    // 079. EROI Panel — Barra de energia
    // =============================================
    createEROIPanel(container) {
        const panel = document.createElement('div');
        panel.id = 'eroi-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;border:1px solid #333;';
        panel.innerHTML = '<div style="color:#f39c12;font-weight:bold;margin-bottom:5px;">⚡ ENERGIA (EROI)</div><div id="eroi-bar-container"></div><div id="eroi-stats"></div>';
        container.appendChild(panel);
    }
    
    updateEROI() {
        const container = document.getElementById('eroi-bar-container');
        const stats = document.getElementById('eroi-stats');
        if (!container || !stats) return;
        
        const inv = this.engine.inventory;
        const woodRatio = Math.min(1, (inv.wood || 0) / 10000);
        const mineralRatio = Math.min(1, (inv.minerals || 0) / 10000);
        const totalEnergy = (woodRatio + mineralRatio) / 2;
        
        const color = totalEnergy > 0.5 ? '#2ecc71' : totalEnergy > 0.2 ? '#f39c12' : '#e74c3c';
        
        container.innerHTML = `<div style="background:#222;border-radius:4px;height:12px;"><div style="background:${color};height:100%;width:${totalEnergy * 100}%;border-radius:4px;transition:width 0.3s;"></div></div>`;
        stats.innerHTML = `<div>🪵 ${(inv.wood || 0).toLocaleString('pt-BR')} | ⛏️ ${(inv.minerals || 0).toLocaleString('pt-BR')} | 💻 ${inv.chips || 0} | 🖥️ ${inv.computers || 0}</div>`;
    }
    
    // =============================================
    // 080. Filtro Sepia para Dark Age
    // =============================================
    updateDarkAgeFilter() {
        const body = document.body;
        if (!body) return;
        
        // Detecta "dark age" — perda de techs recente
        const isDarkAge = this.engine.chronicle?.some(e => 
            e.type === 'warning' && 
            e.message?.includes('COMPLEXIDADE') && 
            e.year >= this.engine.year - 10
        );
        
        if (isDarkAge && !this.darkAgeActive) {
            body.style.filter = 'sepia(0.3) saturate(0.7) brightness(0.9)';
            this.darkAgeActive = true;
        } else if (!isDarkAge && this.darkAgeActive) {
            body.style.filter = 'none';
            this.darkAgeActive = false;
        }
    }
    
    // =============================================
    // 081. Histórico Forense JSON — Download
    // =============================================
    exportForensicJSON() {
        const data = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            seed: this.engine.seed || 'unknown',
            chronicle: this.engine.chronicle || [],
            popHistory: this.popHistory,
            finalState: {
                year: this.engine.year,
                pop: this.engine.globalPop,
                techs: Array.from(this.engine.unlockedTechs || []),
                era: this.engine.currentEra?.name,
                inventory: { ...this.engine.inventory },
                trust: this.engine.globalTrust,
                severity: this.engine.severity
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crom_forensic_y${this.engine.year}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // =============================================
    // 082. Pause Automático por Extinção Tática
    // =============================================
    checkExtinctionPause() {
        if (this.lastPop > 0) {
            const loss = (this.lastPop - this.engine.globalPop) / this.lastPop;
            if (loss > 0.05 && this.engine.globalPop > 0) {
                if (this.engine.pause) this.engine.pause();
                if (this.engine.onEvent) {
                    this.engine.onEvent({ 
                        message: `⏸️ PAUSE AUTOMÁTICO: ${(loss * 100).toFixed(1)}% da população morreu repentinamente!`, 
                        type: 'warning', color: '#ff0000' 
                    }, 'warning');
                }
            }
        }
        this.lastPop = this.engine.globalPop;
    }
    
    // =============================================
    // NOVO: Climate Panel — Temperatura Global
    // =============================================
    createClimatePanel(container) {
        const panel = document.createElement('div');
        panel.id = 'climate-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;border:1px solid #333;';
        panel.innerHTML = '<div style="color:#00cec9;font-weight:bold;margin-bottom:5px;">🌍 CLIMA GLOBAL</div><div id="climate-bar-container"></div><div id="climate-stats" style="margin-top:4px;"></div>';
        container.appendChild(panel);
    }
    
    updateClimate() {
        const container = document.getElementById('climate-bar-container');
        const stats = document.getElementById('climate-stats');
        if (!container || !stats || this.engine.globalTemperature === undefined) return;
        
        const temp = this.engine.globalTemperature; // -1.0 a 1.0
        // Normaliza de 0.0 (Gelo) a 1.0 (Calor)
        const normalized = (temp + 1) / 2;
        
        let color = '#2ecc71'; // Temperado
        let phase = 'Temperado';
        if (temp > 0.8) { color = '#e74c3c'; phase = '⚠️ Grande Seca'; }
        else if (temp > 0.4) { color = '#f39c12'; phase = 'Aquecimento'; }
        else if (temp < -0.8) { color = '#0984e3'; phase = '❄️ Era do Gelo'; }
        else if (temp < -0.4) { color = '#74b9ff'; phase = 'Resfriamento'; }
        
        container.innerHTML = `<div style="background:#222;border-radius:4px;height:12px;position:relative;"><div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#fff;z-index:10;"></div><div style="background:${color};height:100%;width:${normalized * 100}%;border-radius:4px;transition:width 0.3s;"></div></div>`;
        stats.innerHTML = `Fase: <span style="color:${color};font-weight:bold;">${phase}</span>`;
    }

    // =============================================
    // 083. Cemitério de Civilizações (localStorage)
    // =============================================
    createCemeteryPanel(container) {
        const panel = document.createElement('div');
        panel.id = 'cemetery-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;border:1px solid #333;display:none;';
        panel.innerHTML = '<div style="color:#7f8c8d;font-weight:bold;margin-bottom:5px;">🪦 CEMITÉRIO</div><div id="cemetery-list"></div>';
        container.appendChild(panel);
    }
    
    loadCemetery() {
        if (typeof localStorage === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem('crom_cemetery') || '[]');
        } catch { return []; }
    }
    
    buryCurrentCiv() {
        this.cemetery.push({
            year: this.engine.year,
            pop: this.engine.globalPop,
            techs: this.engine.unlockedTechs?.size || 0,
            era: this.engine.currentEra?.name || 'Desconhecida',
            cause: this.engine.globalPop <= 0 ? 'Extinção' : 'Abandono',
            timestamp: Date.now()
        });
        this.cemetery = this.cemetery.slice(-20); // Mantém últimas 20
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('crom_cemetery', JSON.stringify(this.cemetery));
        }
    }
    
    updateCemetery() {
        const list = document.getElementById('cemetery-list');
        const panel = document.getElementById('cemetery-panel');
        if (!list || !panel || this.cemetery.length === 0) return;
        
        panel.style.display = 'block';
        list.innerHTML = this.cemetery.slice(-5).reverse().map(c => 
            `<div style="padding:2px 0;border-bottom:1px solid #222;">🪦 ${c.era} • ${c.year}y • ${c.pop.toLocaleString('pt-BR')} pop • ${c.techs} techs</div>`
        ).join('');
    }
    
    // =============================================
    // Master Update — Chamado pelo game loop
    // =============================================
    update() {
        if (this.engine.day % 30 === 0) { // Mensal
            this.updateChronicle();
            this.updateDemographics();
            this.updateEROI();
            this.updateDarkAgeFilter();
            this.updateClimate(); // NOVO
        }
        if (this.engine.day === 0) { // Anual
            this.updatePopGraph();
            this.updateCemetery();
            this.checkExtinctionPause();
        }
    }
}
