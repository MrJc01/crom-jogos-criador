/**
 * N50. ReligionPanel — Painel de religiões ativas.
 * Exibe: religiões, tenets, followers, temples, piety, spread.
 */
export class ReligionPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.panel = null;
    }

    init() {
        this.panel = document.createElement('div');
        this.panel.id = 'religion-panel';
        this.panel.style.cssText = 'position:absolute;top:60px;right:300px;width:260px;background:rgba(15,15,30,0.92);border:1px solid #9b59b6;border-radius:8px;padding:12px;color:#eee;font-size:12px;z-index:100;display:none;backdrop-filter:blur(8px);';
        this.panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-weight:bold;font-size:14px;color:#9b59b6;">🕌 Religiões</span>
                <button id="rel-close" style="background:none;border:none;color:#888;cursor:pointer;font-size:16px;">✕</button>
            </div>
            <div id="rel-list" style="max-height:300px;overflow-y:auto;"></div>
            <div style="margin-top:8px;border-top:1px solid #333;padding-top:6px;">
                <div>📖 Literacy: <span id="rel-literacy" style="color:#3498db;">0%</span></div>
                <div>📚 Filosofia: <span id="rel-philosophy" style="color:#8e44ad;">-</span></div>
            </div>
        `;
        (this.container || document.body).appendChild(this.panel);
        document.getElementById('rel-close')?.addEventListener('click', () => this.hide());
    }

    update(engine) {
        if (!this.panel || this.panel.style.display === 'none') return;
        const listDiv = document.getElementById('rel-list');
        if (!listDiv) return;

        const religions = engine.religions || {};
        const relEntries = Object.entries(religions);

        if (relEntries.length === 0) {
            listDiv.innerHTML = '<div style="color:#666;font-style:italic;">Nenhuma religião surgiu ainda.</div>';
        } else {
            // Count followers and temples per religion
            const stats = {};
            engine.nodes.forEach(n => {
                if (n.infected && n.religion?.active && n.religion.id) {
                    if (!stats[n.religion.id]) stats[n.religion.id] = { followers: 0, temples: 0, piety: 0, hexes: 0 };
                    stats[n.religion.id].followers += n.demographics.total;
                    stats[n.religion.id].temples += n.religion.temples || 0;
                    stats[n.religion.id].piety += n.religion.piety || 0;
                    stats[n.religion.id].hexes++;
                }
            });

            listDiv.innerHTML = relEntries.map(([id, rel]) => {
                const s = stats[id] || { followers: 0, temples: 0, piety: 0, hexes: 0 };
                const avgPiety = s.hexes > 0 ? Math.floor(s.piety / s.hexes) : 0;
                const pietyColor = avgPiety > 70 ? '#27ae60' : avgPiety > 40 ? '#f39c12' : '#e74c3c';
                const tenetEmojis = { pacifism: '🕊️', sacrifice: '🔪', asceticism: '🧘', expansion: '⚔️', mysticism: '🔮', stewardship: '🌱', ancestor_worship: '👴', holy_war: '🗡️', knowledge: '📚', nature_worship: '🌿' };

                return `<div style="background:#1a1a2e;border-radius:6px;padding:8px;margin-bottom:6px;border-left:3px solid #9b59b6;">
                    <div style="font-weight:bold;color:#ddd;">${rel.name}</div>
                    <div style="color:#888;font-size:11px;">Fundada: ano ${rel.founded || '?'}</div>
                    <div style="margin:4px 0;">${rel.tenets.map(t => `<span title="${t}" style="margin-right:2px;">${tenetEmojis[t] || '📿'}</span>`).join('')} <span style="color:#888;font-size:10px;">${rel.tenets.join(', ')}</span></div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;font-size:11px;">
                        <div>👥 ${s.followers.toLocaleString()}</div>
                        <div>⛪ ${s.temples} templos</div>
                        <div>🗺️ ${s.hexes} hexes</div>
                        <div style="color:${pietyColor};">🙏 Piety: ${avgPiety}%</div>
                    </div>
                </div>`;
            }).join('');
        }

        const litEl = document.getElementById('rel-literacy');
        if (litEl) litEl.textContent = `${Math.floor(engine.literacy || 0)}%`;
        const philEl = document.getElementById('rel-philosophy');
        if (philEl) philEl.textContent = engine.philosophy?.data?.name || engine.philosophy?.current || '-';
    }

    show() { if (this.panel) this.panel.style.display = 'block'; }
    hide() { if (this.panel) this.panel.style.display = 'none'; }
    toggle() { if (this.panel) this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none'; }
}
