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
        }
        if (this.engine.day === 0) { // Anual
            this.updatePopGraph();
            this.updateCemetery();
            this.checkExtinctionPause();
        }
    }
}
