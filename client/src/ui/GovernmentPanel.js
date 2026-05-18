/**
 * N49. GovernmentPanel — Painel visual do governo atual.
 * Exibe: tipo, policies, literacy, GDP, inflação, progresso para próximo governo.
 */
export class GovernmentPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.panel = null;
    }

    init() {
        this.panel = document.createElement('div');
        this.panel.id = 'government-panel';
        this.panel.style.cssText = 'position:absolute;top:60px;right:10px;width:280px;background:rgba(15,15,30,0.92);border:1px solid #8e44ad;border-radius:8px;padding:12px;color:#eee;font-size:12px;z-index:100;display:none;backdrop-filter:blur(8px);';
        this.panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-weight:bold;font-size:14px;color:#8e44ad;">🏛️ Governo</span>
                <button id="gov-close" style="background:none;border:none;color:#888;cursor:pointer;font-size:16px;">✕</button>
            </div>
            <div id="gov-type" style="font-size:16px;font-weight:bold;margin-bottom:6px;"></div>
            <div id="gov-desc" style="color:#aaa;margin-bottom:8px;font-style:italic;"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;">
                <div>⏳ Era: <span id="gov-era" style="color:#00cec9;">Pré-História</span></div>
                <div>📊 Literacy: <span id="gov-literacy" style="color:#3498db;">0%</span></div>
                <div>💰 GDP: <span id="gov-gdp" style="color:#f1c40f;">0</span></div>
                <div>📈 Inflação: <span id="gov-inflation" style="color:#e74c3c;">1.0×</span></div>
                <div>🏦 Tesouro: <span id="gov-treasury" style="color:#f39c12;">0</span></div>
                <div>⚖️ Tax: <span id="gov-tax" style="color:#9b59b6;">0%</span></div>
                <div>📕 Ideologia: <span id="gov-ideology" style="color:#c0392b;">-</span></div>
            </div>
            <div style="margin-bottom:6px;font-weight:bold;color:#8e44ad;">📜 Policies Ativas:</div>
            <div id="gov-policies" style="margin-bottom:8px;color:#aaa;"></div>
            <div style="margin-bottom:6px;font-weight:bold;color:#8e44ad;">⚖️ Leis:</div>
            <div id="gov-laws" style="margin-bottom:8px;color:#aaa;"></div>
            <div style="margin-bottom:4px;font-weight:bold;color:#8e44ad;">🏆 Vitória:</div>
            <div id="gov-victory" style="color:#aaa;"></div>
        `;
        (this.container || document.body).appendChild(this.panel);
        document.getElementById('gov-close')?.addEventListener('click', () => this.hide());
    }

    update(engine) {
        if (!this.panel || this.panel.style.display === 'none') return;
        const gov = engine.currentGovernment;
        const el = id => document.getElementById(id);

        if (gov) {
            el('gov-type').textContent = `${gov.name} (${gov.policySlots} slots)`;
            el('gov-type').style.color = gov.type === 'democracy' ? '#3498db' : gov.type === 'autocracy' ? '#c0392b' : '#f1c40f';
        }
        el('gov-era').textContent = engine.currentEra?.name || 'Idade da Pedra';
        el('gov-literacy').textContent = `${Math.floor(engine.literacy || 0)}%`;
        el('gov-gdp').textContent = Math.floor(engine.market?.gdp || 0).toLocaleString();
        el('gov-inflation').textContent = `${(engine.market?.inflation || 1).toFixed(1)}×`;
        el('gov-treasury').textContent = Math.floor(engine.treasury || 0).toLocaleString();
        el('gov-tax').textContent = `${Math.floor((engine.taxRate || 0) * 100)}%`;
        el('gov-ideology').textContent = engine.ideology || '-';

        // Policies
        const polDiv = el('gov-policies');
        if (polDiv && gov?.policies) {
            polDiv.innerHTML = gov.policies.length > 0 ? gov.policies.map(p => `<div style="padding:2px 6px;background:#2c3e50;border-radius:3px;margin:2px 0;">📜 ${p}</div>`).join('') : '<div style="color:#666;">Nenhuma</div>';
        }

        // Laws
        const lawDiv = el('gov-laws');
        if (lawDiv && engine.laws) {
            lawDiv.innerHTML = engine.laws.length > 0 ? engine.laws.map(l => `<div style="padding:2px 6px;background:#1a1a2e;border-radius:3px;margin:2px 0;">⚖️ ${l.name}</div>`).join('') : '<div style="color:#666;">Nenhuma</div>';
        }

        // Victory progress
        const vicDiv = el('gov-victory');
        if (vicDiv && engine.victoryProgress) {
            const vp = engine.victoryProgress;
            vicDiv.innerHTML = Object.entries(vp).map(([k, v]) => {
                const pct = typeof v === 'number' ? Math.min(100, v) : 0;
                const color = pct >= 75 ? '#27ae60' : pct >= 50 ? '#f39c12' : '#e74c3c';
                return `<div style="margin:2px 0;"><span style="display:inline-block;width:70px;">${k}:</span><div style="display:inline-block;width:120px;height:8px;background:#1a1a2e;border-radius:4px;vertical-align:middle;"><div style="width:${pct}%;height:100%;background:${color};border-radius:4px;"></div></div> <span style="color:${color};">${pct}%</span></div>`;
            }).join('');
        }
    }

    show() { if (this.panel) this.panel.style.display = 'block'; }
    hide() { if (this.panel) this.panel.style.display = 'none'; }
    toggle() { if (this.panel) this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none'; }
}
