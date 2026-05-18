export class TechTree {
    constructor() {
        this.technologies = new Map(); // id -> Módulo da Tecnologia
        this.unlocked = new Set();
    }
    
    register(techModule) {
        this.technologies.set(techModule.id, techModule);
    }
    
    getAvailable() {
        const available = [];
        this.technologies.forEach(tech => {
            if (this.unlocked.has(tech.id)) return;
            
            let canUnlock = true;
            if (tech.requires) {
                for (const req of tech.requires) {
                    if (!this.unlocked.has(req)) canUnlock = false;
                }
            }
            if (canUnlock) available.push(tech);
        });
        return available;
    }
    
    getModifiedCost(tech, engine) {
        let affinitySum = 0;
        let totalFactionsWeighted = 0;
        
        const factions = engine.plugins.filter(p => p.type === 'faction');
        
        if (factions.length > 0 && engine.globalPop > 0) {
            engine.nodes.forEach(node => {
                if (!node.infected) return;
                
                factions.forEach(f => {
                    const frac = node.demographics.dist.factions[f.id] || 0;
                    if (frac > 0) {
                        const aff = f.affinities[tech.root] || 1.0;
                        affinitySum += frac * aff * node.demographics.total;
                        totalFactionsWeighted += frac * node.demographics.total;
                    }
                });
                
                // Os 'tribal' (base) têm afinidade 1.0 para tudo
                const tribalFrac = node.demographics.dist.factions['tribal'] || 0;
                if (tribalFrac > 0) {
                    affinitySum += tribalFrac * 1.0 * node.demographics.total;
                    totalFactionsWeighted += tribalFrac * node.demographics.total;
                }
            });
        }
        
        let avgAffinity = totalFactionsWeighted > 0 ? (affinitySum / totalFactionsWeighted) : 1.0;
        if (avgAffinity === 0) avgAffinity = 1.0;
        
        let cost = tech.baseCost / avgAffinity;
        
        // Aplica desconto da Rede Neural (Conhecimento Passivo)
        if (tech.knowledgeBonus && engine.knowledge) {
            for (const [kId, discountMax] of Object.entries(tech.knowledgeBonus)) {
                const mastery = engine.knowledge.getMastery(kId); 
                cost = cost * (1 - (mastery * discountMax));
            }
        }
        
        // TAREFA 26: A Singularidade é Exponencial
        // Na Era da Informação/Espacial (mult > 500), computadores reduzem o custo massivamente
        if (engine.currentEra.mult >= 1000) {
            const compDiscount = Math.min(0.9, engine.inventory.computers / 100000); // Até 90% mais barato
            cost *= (1.0 - compDiscount);
        }
        
        // TAREFA 22: Gargalo de Inovação de Excedente
        // Se a humanidade está colapsando (Trust < 30) ou se a pressão biológica (fome/doença) está alta, P&D custa muito mais
        if (engine.globalTrust < 30 || (engine.pressures && engine.pressures.biological > 0.8)) {
            cost *= 3.0; // Pânico atrasa inovação
        }
        
        return Math.max(1, Math.floor(cost));
    }
    
    // TAREFA 27: Gênios Históricos Estocásticos
    checkGeniusSpawn(engine) {
        if (!this.geniusDiscount) this.geniusDiscount = 1.0;
        if (!this.geniusCooldown) this.geniusCooldown = 0;
        if (this.geniusCooldown > 0) { this.geniusCooldown--; return; }
        if (Math.random() < 0.0005) { // 0.05% chance ao dia (~1 gênio a cada 5 anos)
            this.geniusDiscount = 0.1;
            this.geniusCooldown = 365; // 1 ano de cooldown entre gênios
            if (engine.onEvent) engine.onEvent({ message: `🧠 GÊNIO DO SÉCULO: Um intelecto ímpar nasceu! A próxima tech custará quase nada (90% desconto).`, type: "milestone", color: "#ffffff" }, "milestone");
        }
    }
    
    buy(techId, engine) {
        const tech = this.technologies.get(techId);
        if (!tech) return false;
        
        let cost = this.getModifiedCost(tech, engine);
        
        // Aplica o desconto de Gênio, se houver
        if (this.geniusDiscount && this.geniusDiscount < 1.0) {
            cost = Math.max(1, Math.floor(cost * this.geniusDiscount));
            this.geniusDiscount = 1.0; // Gênio morre/é consumido
        }
        
        // TAREFA 25: Condição Física para Pesquisa (Queimar itens baseados na era)
        // Idade do Bronze pra cima exige minerais para avançar
        if (engine.currentEra.mult >= 10 && engine.inventory.minerals < 500) return false; // Faltam componentes físicos
        
        if (engine.adaptationPoints >= cost) {
            engine.adaptationPoints -= cost;
            if (engine.currentEra.mult >= 10) engine.inventory.minerals -= 500; // Paga o custo físico
            
            this.unlocked.add(techId);
            if (tech.onUnlock) tech.onUnlock(engine);
            return true;
        }
        return false;
    }
    
    /**
     * 034. Difusão Lenta por Osmose — Techs vazam entre nós vizinhos conectados.
     * Chamado mensalmente pelo Engine. Chance de copiar 1 tech de um vizinho mais avançado.
     */
    processTechDiffusion(engine) {
        if (engine.day % 30 !== 0) return; // Mensal
        engine.nodes.forEach(node => {
            if (!node.infected || node.neighbors.length === 0) return;
            
            // Pega um vizinho aleatório
            const neighborId = node.neighbors[Math.floor(Math.random() * node.neighbors.length)];
            const neighbor = engine.nodes.get(neighborId);
            if (!neighbor || !neighbor.infected) return;
            
            // Chance base de difusão: 0.5% por mês por vizinho
            if (Math.random() > 0.005) return;
            
            // Nó com mais pop "ensina" o menor
            if (neighbor.demographics.total > node.demographics.total * 2) {
                // O vizinho maior tem techs que o nó menor não tem?
                // Usa as techs globais do engine (simplificação: techs são globais)
                // Em futuro: techs por nó/facção
            }
        });
    }
    
    processAutonomousEvolution(engine) {
        // Rola 5% de chance de analisar por dia (para não pesar a CPU com cálculos desnecessários diários)
        if (Math.random() > 0.05) return;
        
        const available = this.getAvailable();
        if (available.length === 0) return;
        
        const candidates = [];
        let totalWeight = 0;
        
        for (const tech of available) {
            const cost = this.getModifiedCost(tech, engine);
            if (engine.adaptationPoints >= cost) {
                // Peso base estocástico (inverso do custo)
                let weight = (1000 / cost);
                
                // Contexto (LLM-like approach)
                if (engine.severity > 50 && tech.root === 'biology') weight *= 3.0; // Urgência médica
                if ((engine.inventory.wood > 50000 || engine.inventory.minerals > 50000) && tech.root === 'industry') weight *= 2.0; // Pressão industrial
                
                // Eureka System: Traumas Culturais direcionam pesquisa (Sobrevivência P0)
                if (tech.traumaTrigger) {
                    let hasTrauma = false;
                    const factions = engine.plugins.filter(p => p.type === 'faction');
                    // Simulação rápida para checar se alguma facção viva tem o trauma (TechTree não importa FactionsData para evitar ciclo)
                    if (engine.globalDemographics?.factions) {
                        // Verifica no cache global do motor se o trauma foi ativado recentemente
                        // OU se as techs tiverem tags de sobrevivência e houver deficit
                    }
                    // Alternativamente, olhamos a temperatura global se o trauma for climático
                    if (tech.traumaTrigger === 'ice_survivors' && engine.globalTemperature < -0.6) weight *= 50.0;
                    if (tech.traumaTrigger === 'desert_survivors' && engine.globalTemperature > 0.6) weight *= 50.0;
                    if (tech.traumaTrigger === 'famine_trauma' && (engine._foodDeficit || 0) > 0.1) weight *= 50.0;
                }
                
                // Variável de Caos (0.1 a 2.0)
                const chaos = 0.1 + (Math.random() * 1.9);
                weight *= chaos;
                
                candidates.push({ tech, cost, weight });
                totalWeight += weight;
            }
        }
        
        if (candidates.length === 0) return;
        
        // Rola o dado probabilístico
        let roll = Math.random() * totalWeight;
        let selected = null;
        for (const cand of candidates) {
            roll -= cand.weight;
            if (roll <= 0) {
                selected = cand;
                break;
            }
        }
        
        if (selected) {
            this.buy(selected.tech.id, engine);
            if (engine.onEvent) {
                engine.onEvent(selected.tech.name, "tech_auto");
            }
        }
    }
}
