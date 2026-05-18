export default {
    id: 'tech_dogmatism',
    name: 'Dogmatismo e Cultos Unificados',
    type: 'technology',
    root: 'spiritual', // Pertence ao ramo Espiritual
    baseCost: 6000,
    requires: ["codigo_de_leis"], // Pode ser a primeira espiritual
    
    onUnlock(engine) {
        // Reduz a agressividade base global em troca de submissão
        if (engine.config) {
            engine.config.warChance = Math.max(0.01, engine.config.warChance * 0.5);
        }
        
        // Emite o evento de Milestone
        if (engine.onEvent) {
            engine.onEvent({
                message: `🕊️ MARCO ESPIRITUAL: A humanidade cedeu ao Dogmatismo. As guerras despencaram pela metade, mas a estagnação tecnológica é iminente.`,
                type: 'milestone',
                color: '#9b59b6'
            }, "milestone");
        }
    }
};
