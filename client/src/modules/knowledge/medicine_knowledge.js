/** N45. Medicine Knowledge — Conhecimento médico passivo. */
export default {
    id: 'medicine_knowledge',
    type: 'knowledge',
    applyTick(node, globalRules, engine) {
        if (engine.day % 365 !== 0) return;
        if (!engine.medKnowledge) engine.medKnowledge = 0;

        // Acumula com techs médicas
        let growth = 0.5;
        if (engine.unlockedTechs?.has('medicine')) growth += 1;
        if (engine.unlockedTechs?.has('antibioticos')) growth += 2;
        if (engine.unlockedTechs?.has('vacinas')) growth += 3;
        if (engine.unlockedTechs?.has('genetica_avancada')) growth += 5;
        engine.medKnowledge = Math.min(100, engine.medKnowledge + growth);

        // Efeitos graduais
        engine.nodes.forEach(n => {
            if (!n.infected) return;
            // Reduz mortalidade proporcionalmente ao conhecimento
            n.medKnowledgeEffect = 1 - (engine.medKnowledge / 200); // 0.5-1.0
            // Lifespan boost
            if (engine.medKnowledge > 50) {
                n.lifespanBonus = (engine.medKnowledge - 50) * 0.2; // +0-10 anos
            }
        });

        if (engine.medKnowledge % 25 === 0 && engine.medKnowledge > 0 && engine.onEvent) {
            engine.onEvent({
                message: `🏥 SABER MÉDICO: Nível ${engine.medKnowledge}%. Mortalidade reduzida em ${Math.floor(engine.medKnowledge/2)}%.`,
                type: 'milestone', color: '#e74c3c'
            }, 'milestone');
        }
    }
};
