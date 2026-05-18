/** N44. Agriculture Knowledge — Conhecimento agrícola passivo. */
export default {
    id: 'agriculture_knowledge',
    type: 'knowledge',
    applyTick(node, globalRules, engine) {
        if (engine.day % 365 !== 0) return; // Anual
        if (!engine.unlockedTechs?.has('agriculture')) return;
        if (!engine.agriKnowledge) engine.agriKnowledge = 0;

        // Acumula conhecimento agrícola ao longo do tempo
        engine.agriKnowledge = Math.min(100, engine.agriKnowledge + 1);

        // Efeitos graduais
        if (engine.agriKnowledge >= 10) {
            // Crop rotation natural descoberta
            engine.nodes.forEach(n => { if (n.infected && n.crops?.length === 1 && Math.random() < 0.01) {
                const extras = { plains: 'corn', jungle: 'berries', tundra: 'potato', desert: 'dates' };
                const extra = extras[n.biome?.id || 'plains'];
                if (extra && !n.crops.includes(extra)) n.crops.push(extra);
            }});
        }
        if (engine.agriKnowledge >= 30) {
            // Fertilização: solo recupera 10% mais rápido
            engine.nodes.forEach(n => { if (n.infected && n.soil !== undefined) n.soil = Math.min(100, n.soil + 0.05); });
        }
        if (engine.agriKnowledge >= 60) {
            // Irrigação natural: hexes constroem canais automaticamente
            engine.nodes.forEach(n => { if (n.infected && n.irrigation?.level === 0) n.irrigation = { level: 1, canals: [] }; });
        }

        if (engine.agriKnowledge % 25 === 0 && engine.agriKnowledge > 0 && engine.onEvent) {
            engine.onEvent({
                message: `🌾 SABER AGRÍCOLA: Nível ${engine.agriKnowledge}%. Técnicas de cultivo melhoram passivamente.`,
                type: 'milestone', color: '#27ae60'
            }, 'milestone');
        }
    }
};
