export class Demographics {
    constructor(initialPopulation) {
        this.total = initialPopulation;
        
        // Tensores de Distribuição (Porcentagens 0.0 a 1.0)
        this.dist = {
            sex: { M: 0.5, F: 0.5 },
            age: { child: 0.2, young: 0.3, adult: 0.4, elder: 0.1 },
            religion: { animism: 1.0 }, // Exemplo, pode ser injetado por scripts
            factions: { tribal: 1.0 } // As facções lutarão por % dessa torta
        };
        
        // Fila de Gestação: Cada índice é um dia. Índice 0 nasce amanhã.
        // Array de 270 dias (9 meses). Valores são números absolutos de fetos.
        this.pregnancyQueue = new Array(270).fill(0);
    }
    
    // Injeta novos nascimentos na demografia e recalcula a matriz de Idades
    addBirths(amount) {
        if (amount <= 0) return;
        
        const newTotal = this.total + amount;
        if (newTotal === 0) return;
        
        // As novas pessoas são "crianças". A % de crianças sobe, o resto é diluído.
        const oldChildCount = this.total * this.dist.age.child;
        this.dist.age.child = (oldChildCount + amount) / newTotal;
        
        this.dist.age.young = (this.total * this.dist.age.young) / newTotal;
        this.dist.age.adult = (this.total * this.dist.age.adult) / newTotal;
        this.dist.age.elder = (this.total * this.dist.age.elder) / newTotal;
        
        this.total = newTotal;
    }
    
    kill(amount) {
        if (amount <= 0) return;
        this.total = Math.max(0, this.total - amount);
        // Num futuro, desastres podem matar % específicas (ex: vírus mata idosos)
    }

    // Função utilitária para mutação de distribuição genérica
    shiftDistribution(category, keyIncrease, keyDecrease, amount) {
        if (this.dist[category][keyDecrease] >= amount) {
            this.dist[category][keyDecrease] -= amount;
            this.dist[category][keyIncrease] += amount;
        }
    }

    // Move uma porcentagem `rate` da população de `sourceFaction` para `targetFaction`
    assimilate(targetFaction, sourceFaction, rate) {
        if (!this.dist.factions[sourceFaction]) return;
        const amountToMove = this.dist.factions[sourceFaction] * rate;
        
        this.dist.factions[sourceFaction] -= amountToMove;
        
        if (!this.dist.factions[targetFaction]) {
            this.dist.factions[targetFaction] = 0;
        }
        this.dist.factions[targetFaction] += amountToMove;
        
        if (this.dist.factions[sourceFaction] < 0.0001) {
            delete this.dist.factions[sourceFaction];
        }
    }
    
    // Fratura (Cisma) uma facção
    splitFaction(parentFaction, childFaction, percentageOfParent) {
        if (!this.dist.factions[parentFaction]) return;
        const amountToMove = this.dist.factions[parentFaction] * percentageOfParent;
        
        this.dist.factions[parentFaction] -= amountToMove;
        
        if (!this.dist.factions[childFaction]) {
            this.dist.factions[childFaction] = 0;
        }
        this.dist.factions[childFaction] += amountToMove;
    }
}
