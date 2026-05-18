export class KnowledgeBase {
    constructor() {
        this.knowledges = new Map(); // id -> Módulo
        this.mastery = new Map(); // id -> Float (0.0 a 1.0)
    }

    register(module) {
        this.knowledges.set(module.id, module);
        this.mastery.set(module.id, 0.0);
    }

    getMastery(id) {
        return this.mastery.get(id) || 0.0;
    }

    processTick(engine) {
        this.knowledges.forEach(k => {
            // Novo formato: applyTick (auto-gerenciado)
            if (typeof k.applyTick === 'function') {
                engine.nodes.forEach(node => {
                    k.applyTick(node, {}, engine);
                });
                return;
            }
            // Legacy formato: calculateDailyXP
            if (typeof k.calculateDailyXP !== 'function') return;
            const currentMastery = this.mastery.get(k.id) || 0;
            if (currentMastery < 1.0) {
                const xp = k.calculateDailyXP(engine);
                if (xp > 0) {
                    const newMastery = Math.min(1.0, currentMastery + xp);
                    this.mastery.set(k.id, newMastery);
                    
                    if (newMastery === 1.0 && currentMastery < 1.0) {
                        if (k.onMastery) k.onMastery(engine);
                    }
                }
            }
        });
    }
}
