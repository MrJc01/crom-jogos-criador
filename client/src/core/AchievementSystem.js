/**
 * 095-099. Sistema de Conquistas e Persistência.
 * 095. Conquistas (localStorage)
 * 096. Estatísticas Persistentes
 * 097. Hall da Fama
 * 098. Seeds de Mundo
 * 099. Export de Replay
 */
export class AchievementSystem {
    constructor() {
        this.achievements = {};
        this.stats = { totalCivs: 0, totalYears: 0, totalPop: 0 };
        this.hallOfFame = [];
        this.seed = null;
        this.load();
    }
    
    load() {
        if (typeof localStorage === 'undefined') return;
        try {
            const saved = localStorage.getItem('crom_achievements');
            if (saved) this.achievements = JSON.parse(saved);
            const stats = localStorage.getItem('crom_stats');
            if (stats) this.stats = JSON.parse(stats);
            const hof = localStorage.getItem('crom_hall_of_fame');
            if (hof) this.hallOfFame = JSON.parse(hof);
        } catch(e) {}
    }
    
    save() {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem('crom_achievements', JSON.stringify(this.achievements));
            localStorage.setItem('crom_stats', JSON.stringify(this.stats));
            localStorage.setItem('crom_hall_of_fame', JSON.stringify(this.hallOfFame));
        } catch(e) {}
    }
    
    // 095. Verifica conquistas
    check(engine) {
        const checks = [
            { id: 'survive_100', name: 'Centenário', desc: 'Sobreviveu 100 anos', cond: () => engine.year >= 100 },
            { id: 'survive_500', name: 'Meia Milênio', desc: 'Sobreviveu 500 anos', cond: () => engine.year >= 500 },
            { id: 'survive_1000', name: 'Milênio', desc: 'Sobreviveu 1000 anos', cond: () => engine.year >= 1000 },
            { id: 'pop_million', name: 'Primeiro Milhão', desc: 'Atingiu 1M de população', cond: () => engine.globalPop >= 1000000 },
            { id: 'pop_10m', name: 'Metrópole Global', desc: 'Atingiu 10M de população', cond: () => engine.globalPop >= 10000000 },
            { id: 'tech_10', name: 'Cientista', desc: 'Desbloqueou 10 techs', cond: () => engine.unlockedTechs.size >= 10 },
            { id: 'tech_30', name: 'Iluminista', desc: 'Desbloqueou 30 techs', cond: () => engine.unlockedTechs.size >= 30 },
            { id: 'tech_all', name: 'Transcendência', desc: 'Desbloqueou todas as techs', cond: () => engine.unlockedTechs.size >= 49 },
            { id: 'dyson', name: 'Esfera de Dyson', desc: 'Construiu uma Esfera de Dyson', cond: () => engine.unlockedTechs.has('esfera_de_dyson') },
            { id: 'survive_nuclear', name: 'Sobrevivente Nuclear', desc: 'Sobreviveu ao Grande Filtro Nuclear', cond: () => engine.unlockedTechs.has('tech_nuclear') && engine.year > 200 && engine.globalPop > 0 },
            { id: 'dark_age', name: 'Idade das Trevas', desc: 'Perdeu techs por colapso demográfico', cond: () => engine.chronicle?.some(e => e.type === 'warning' && e.message?.includes('TREVAS')) },
            { id: 'pandemic', name: 'Praga Sobrevivida', desc: 'Sobreviveu a uma pandemia SIR', cond: () => engine.chronicle?.some(e => e.type === 'pandemic') },
        ];
        
        const newUnlocks = [];
        for (const ach of checks) {
            if (!this.achievements[ach.id] && ach.cond()) {
                this.achievements[ach.id] = { unlockedAt: engine.year, name: ach.name };
                newUnlocks.push(ach);
                if (engine.onEvent) {
                    engine.onEvent({ message: `🏆 CONQUISTA: "${ach.name}" — ${ach.desc}`, type: "achievement", color: "#ffd700" }, "achievement");
                }
            }
        }
        
        if (newUnlocks.length > 0) this.save();
        return newUnlocks;
    }
    
    // 096. Atualiza estatísticas
    updateStats(engine) {
        this.stats.totalYears = Math.max(this.stats.totalYears, engine.year);
        this.stats.totalPop = Math.max(this.stats.totalPop, engine.globalPop);
        this.save();
    }
    
    // 097. Hall da Fama
    submitToHallOfFame(engine) {
        const entry = {
            year: engine.year,
            pop: engine.globalPop,
            techs: engine.unlockedTechs.size,
            era: engine.currentEra.name,
            timestamp: Date.now()
        };
        this.hallOfFame.push(entry);
        this.hallOfFame.sort((a, b) => b.year - a.year); // Ordenar por duração
        this.hallOfFame = this.hallOfFame.slice(0, 10); // Top 10
        this.stats.totalCivs++;
        this.save();
    }
    
    // 098. Seeds de Mundo
    generateSeed() {
        this.seed = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase();
        return this.seed;
    }
    
    // 099. Export de Replay
    exportReplay(engine) {
        return JSON.stringify({
            seed: this.seed,
            chronicle: engine.chronicle || [],
            finalState: {
                year: engine.year,
                pop: engine.globalPop,
                techs: Array.from(engine.unlockedTechs),
                era: engine.currentEra.name,
                achievements: this.achievements
            }
        }, null, 2);
    }
}
