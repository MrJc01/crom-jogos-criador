/**
 * TechPanel — Painel de seleção de tecnologias.
 * 
 * 038. Mostrar 3 opções de tech ao jogador (Stellaris-style)
 * 060. Escala de Kardashev — HUD bar
 */
export class TechPanel {
    constructor(engine) {
        this.engine = engine;
        this.pendingChoices = [];
        this.initPanel();
    }
    
    initPanel() {
        if (typeof document === 'undefined') return;
        
        // Container principal da tech choice
        const panel = document.createElement('div');
        panel.id = 'tech-choice-panel';
        panel.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.95); border: 2px solid #ffaa00; border-radius: 12px;
            padding: 20px; min-width: 600px; z-index: 500; display: none;
            font-family: 'Segoe UI', monospace; color: #ddd;
            box-shadow: 0 0 30px rgba(255,170,0,0.3);
        `;
        panel.innerHTML = `
            <div style="text-align:center;font-size:16px;color:#ffaa00;font-weight:bold;margin-bottom:15px;">
                🔬 PESQUISA DISPONÍVEL
            </div>
            <div id="tech-choices" style="display:flex;gap:10px;justify-content:center;"></div>
        `;
        document.body.appendChild(panel);
        
        // Kardashev HUD bar
        const kBar = document.createElement('div');
        kBar.id = 'kardashev-bar';
        kBar.style.cssText = `
            position: fixed; bottom: 50px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.8); border-radius: 20px; padding: 5px 15px;
            z-index: 100; font-size: 10px; color: #aaa; display: flex; gap: 8px;
            align-items: center; border: 1px solid #333;
        `;
        document.body.appendChild(kBar);
    }
    
    /**
     * 038. Apresenta 3 opções de tech para o jogador escolher.
     * Cada opção é uma tech disponível que o jogador pode desbloquear.
     */
    presentChoices() {
        if (typeof document === 'undefined') return;
        
        const available = this.getAvailableTechs();
        if (available.length === 0) return;
        
        // Pega 3 aleatórias (ou menos se não houver 3)
        const shuffled = available.sort(() => Math.random() - 0.5);
        this.pendingChoices = shuffled.slice(0, 3);
        
        const container = document.getElementById('tech-choices');
        const panel = document.getElementById('tech-choice-panel');
        if (!container || !panel) return;
        
        container.innerHTML = this.pendingChoices.map((tech, i) => `
            <div id="tech-choice-${i}" class="tech-card" style="
                background: rgba(30,30,30,0.9); border: 1px solid #555; border-radius: 8px;
                padding: 12px; width: 170px; cursor: pointer; transition: all 0.2s;
                text-align: center;
            " onmouseover="this.style.borderColor='#ffaa00';this.style.transform='scale(1.05)'"
               onmouseout="this.style.borderColor='#555';this.style.transform='scale(1)'">
                <div style="font-size:20px;margin-bottom:5px;">${this.getTechIcon(tech.root)}</div>
                <div style="color:#ffaa00;font-weight:bold;font-size:12px;">${tech.name}</div>
                <div style="color:#888;font-size:10px;margin:5px 0;">${tech.era || ''}</div>
                <div style="color:#3498db;font-size:11px;">💰 ${tech.baseCost.toLocaleString('pt-BR')} DNA</div>
                ${tech.modifiers ? `<div style="color:#aaa;font-size:9px;margin-top:5px;">${this.formatModifiers(tech.modifiers)}</div>` : ''}
            </div>
        `).join('');
        
        // Add click handlers
        this.pendingChoices.forEach((tech, i) => {
            const card = document.getElementById(`tech-choice-${i}`);
            if (card) {
                card.addEventListener('click', () => this.selectTech(tech));
            }
        });
        
        panel.style.display = 'block';
    }
    
    selectTech(tech) {
        // Tenta desbloquear
        if (this.engine.adaptationPoints >= tech.baseCost) {
            this.engine.adaptationPoints -= tech.baseCost;
            this.engine.techTree.unlock(tech.id);
            this.engine.unlockedTechs.add(tech.id);
            
            if (this.engine.onEvent) {
                this.engine.onEvent({ 
                    message: `🔬 PESQUISA CONCLUÍDA: ${tech.name}`, 
                    type: 'milestone', color: '#ffaa00' 
                }, 'tech_manual');
            }
        }
        
        // Fecha o painel
        const panel = document.getElementById('tech-choice-panel');
        if (panel) panel.style.display = 'none';
        this.pendingChoices = [];
    }
    
    getAvailableTechs() {
        const config = this.engine.techTree?.config;
        if (!config) return [];
        
        const available = [];
        for (const [id, tech] of Object.entries(config)) {
            if (id.startsWith('_')) continue;
            if (this.engine.unlockedTechs.has(id)) continue;
            
            // Verifica pré-requisitos
            const reqs = tech.requires || [];
            const hasReqs = reqs.every(r => this.engine.unlockedTechs.has(r));
            if (!hasReqs) continue;
            
            // Verifica se tem DNA suficiente
            if (this.engine.adaptationPoints < tech.baseCost) continue;
            
            available.push({ id, ...tech });
        }
        return available;
    }
    
    getTechIcon(root) {
        const icons = {
            'biological': '🧬', 'physical': '⚛️', 'social': '👥',
            'philosophical': '📚', 'technological': '💻', 'spiritual': '🕋',
            'sociology': '🏛️'
        };
        return icons[root] || '🔬';
    }
    
    formatModifiers(mods) {
        const parts = [];
        if (mods.global_K_boost && mods.global_K_boost !== 1) {
            parts.push(`K×${mods.global_K_boost}`);
        }
        if (mods.global_r_boost && mods.global_r_boost !== 1) {
            parts.push(`r×${mods.global_r_boost}`);
        }
        if (mods.severity_flat_increase) {
            const sev = mods.severity_flat_increase;
            parts.push(`Sev ${sev > 0 ? '+' : ''}${sev}`);
        }
        return parts.join(' | ') || 'Sem efeito direto';
    }
    
    /**
     * 060. Escala de Kardashev — Atualiza a barra HUD.
     * Tipo 0: Civilização planetária parcial
     * Tipo I: Usa toda energia do planeta (~10^16 W)
     * Tipo II: Usa toda energia da estrela (Dyson)
     * Tipo III: Usa toda energia da galáxia
     */
    updateKardashev() {
        const bar = document.getElementById('kardashev-bar');
        if (!bar) return;
        
        const pop = this.engine.globalPop;
        const techs = this.engine.unlockedTechs?.size || 0;
        const hasDyson = this.engine.unlockedTechs?.has('space_dyson');
        const hasArk = this.engine.unlockedTechs?.has('space_ark');
        
        // Cálculo de tipo Kardashev
        let kValue = 0;
        if (pop > 0) kValue = Math.log10(pop * (techs + 1)) / 10;
        if (hasDyson) kValue = Math.max(kValue, 2.0);
        if (hasArk) kValue = Math.max(kValue, 2.5);
        
        const kType = kValue >= 2.0 ? 'II' : kValue >= 1.0 ? 'I' : '0';
        const kColor = kType === 'II' ? '#ffaa00' : kType === 'I' ? '#3498db' : '#888';
        
        const segments = [
            { label: '0', min: 0, max: 0.5 },
            { label: '0.5', min: 0.5, max: 1.0 },
            { label: 'I', min: 1.0, max: 1.5 },
            { label: 'I.5', min: 1.5, max: 2.0 },
            { label: 'II', min: 2.0, max: 2.5 },
            { label: 'III', min: 2.5, max: 3.0 }
        ];
        
        bar.innerHTML = `
            <span style="color:#ffaa00;font-weight:bold;">K</span>
            ${segments.map(s => {
                const filled = kValue >= s.min;
                const partial = kValue >= s.min && kValue < s.max;
                const fillPct = partial ? ((kValue - s.min) / (s.max - s.min)) * 100 : (filled ? 100 : 0);
                return `<div style="width:30px;height:8px;background:#222;border-radius:4px;overflow:hidden;" title="Tipo ${s.label}">
                    <div style="height:100%;width:${fillPct}%;background:${kColor};border-radius:4px;transition:width 0.5s;"></div>
                </div>`;
            }).join('')}
            <span style="color:${kColor};font-weight:bold;">Tipo ${kType}</span>
            <span style="color:#666;">(${kValue.toFixed(2)})</span>
        `;
    }
}
