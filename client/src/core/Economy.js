import { FactionsData } from './FactionsData.js';

export class Economy {
    constructor() {
        this.recipes = new Map();
        this.activeCrafts = [];
        this.trustWallet = {}; // Saldo global de Confiança (Moeda Inter-Facções)
    }
    
    register(recipeModule) {
        this.recipes.set(recipeModule.id, recipeModule);
    }

    getTrust(factionId) {
        return this.trustWallet[factionId] || 0;
    }
    
    addTrust(factionId, amount) {
        if (!this.trustWallet[factionId]) this.trustWallet[factionId] = 0;
        this.trustWallet[factionId] += amount;
    }
    
    spendTrust(factionId, amount) {
        if (this.getTrust(factionId) >= amount) {
            this.trustWallet[factionId] -= amount;
            return true;
        }
        return false;
    }

    stealTrust(victimId, agressorId, percentage) {
        const victimBalance = this.getTrust(victimId);
        if (victimBalance <= 0) return 0;
        
        const stolenAmount = Math.floor(victimBalance * percentage);
        this.trustWallet[victimId] -= stolenAmount;
        
        if (!this.trustWallet[agressorId]) this.trustWallet[agressorId] = 0;
        this.trustWallet[agressorId] += stolenAmount;
        
        return stolenAmount;
    }
    
    startCraft(recipeId, engine) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;
        
        // Verifica requisitos de tecnologia
        if (recipe.requirements) {
            for (const req of recipe.requirements) {
                if (!engine.unlockedTechs.has(req)) return false;
            }
        }
        
        // Verifica inputs
        for (const [res, amount] of Object.entries(recipe.inputs)) {
            if (res === 'adaptationPoints') {
                if (engine.adaptationPoints < amount) return false;
            } else {
                if ((engine.inventory[res] || 0) < amount) return false;
            }
        }
        
        // Consome inputs
        for (const [res, amount] of Object.entries(recipe.inputs)) {
            if (res === 'adaptationPoints') engine.adaptationPoints -= amount;
            else engine.inventory[res] -= amount;
        }
        
        // Tarefa 16: O crafting agora passa por 4 etapas
        this.activeCrafts.push({
            recipeId,
            ticksRemaining: recipe.craftTimeTicks,
            totalTicks: recipe.craftTimeTicks,
            stage: 'design' // design -> extraction -> fabrication -> assembly
        });
        
        return true;
    }
    
    processTick(engine) {
        for (let i = this.activeCrafts.length - 1; i >= 0; i--) {
            const craft = this.activeCrafts[i];
            
            // Logística de Especialização (Tarefas 16 e 18 simplificadas)
            // Se as facções possuírem a especialização necessária para a etapa atual, o tempo corre normal. Senão, fica mais lento.
            let hasSpecialist = false;
            if (this.specializations) {
                for (const spec of Object.values(this.specializations)) {
                    if (spec === craft.stage) hasSpecialist = true;
                }
            }
            
            // Deduz o tempo (penalidade se não houver especialista)
            craft.ticksRemaining -= hasSpecialist ? 1 : 0.5;
            
            // Avança o estágio
            const pct = craft.ticksRemaining / craft.totalTicks;
            if (pct <= 0.75 && craft.stage === 'design') craft.stage = 'extraction';
            else if (pct <= 0.5 && craft.stage === 'extraction') craft.stage = 'fabrication';
            else if (pct <= 0.25 && craft.stage === 'fabrication') craft.stage = 'assembly';

            if (craft.ticksRemaining <= 0) {
                const recipe = this.recipes.get(craft.recipeId);
                for (const [res, amount] of Object.entries(recipe.outputs)) {
                    engine.inventory[res] = (engine.inventory[res] || 0) + amount;
                }
                if (recipe.onComplete) recipe.onComplete(engine);
                this.activeCrafts.splice(i, 1);
            }
        }

        // --- Geração Passiva de Confiança Anual (Yield) ---
        if (engine.day === 365) {
            const factionPops = {};
            engine.nodes.forEach(node => {
                if (!node.infected) return;
                for (const [fac, pct] of Object.entries(node.demographics.dist.factions)) {
                    factionPops[fac] = (factionPops[fac] || 0) + (pct * node.demographics.total);
                }
            });
            
            // Especialização de Facções (Tarefa 17)
            if (!this.specializations) this.specializations = {};
            const roles = ['extraction', 'design', 'fabrication', 'assembly'];

            for (const [fac, pop] of Object.entries(factionPops)) {
                if (pop < 10) continue; 
                
                const data = FactionsData.getFaction(fac);

                // Atribui uma especialização se não tiver
                if (!this.specializations[fac]) {
                    this.specializations[fac] = roles[Math.floor(Math.random() * roles.length)];
                }

                let trustYield = 1.0; // Ganho base
                
                if (data.traits.includes("spiritual")) trustYield += 3.0;
                if (data.traits.includes("pacifist")) trustYield += 2.0;
                if (data.traits.includes("ecological")) trustYield += 1.0;
                if (data.traits.includes("militarist")) trustYield -= 1.5;
                if (data.traits.includes("expansionist")) trustYield -= 0.5;
                
                if (engine.severity > 50) trustYield -= (engine.severity - 50) * 0.05;

                const generated = Math.floor((pop / 10000) * trustYield) + Math.max(0, Math.floor(trustYield));
                
                if (generated > 0) {
                    this.addTrust(fac, generated);
                } else if (generated < 0) {
                    this.trustWallet[fac] = Math.max(0, this.getTrust(fac) + generated);
                }
            }

            // --- Monopólios e Aquisições (Tarefa 19) ---
            const activeFactions = Object.keys(factionPops);
            if (activeFactions.length > 1) {
                // Ordena por riqueza
                activeFactions.sort((a,b) => this.getTrust(b) - this.getTrust(a));
                const richest = activeFactions[0];
                const poorest = activeFactions[activeFactions.length - 1];
                
                // Se a mais rica tiver 10x mais trust que a mais pobre, ela compra (hostile takeover)
                if (this.getTrust(richest) > 5000 && this.getTrust(richest) > this.getTrust(poorest) * 10) {
                    // Assimilação econômica
                    this.spendTrust(richest, this.getTrust(poorest) * 2); // Custa o dobro da riqueza do pobre para comprar
                    
                    if (engine.onEvent) {
                        const rData = FactionsData.getFaction(richest);
                        const pData = FactionsData.getFaction(poorest);
                        engine.onEvent({ message: `📉 MONOPÓLIO: ${rData.name} realizou uma aquisição corporativa hostil de ${pData.name}.`, color: '#ffaa00' }, "milestone");
                    }
                    
                    // Transfere população lentamente no mundo
                    engine.nodes.forEach(node => {
                        if (!node.infected) return;
                        const dist = node.demographics.dist.factions;
                        if (dist[poorest]) {
                            dist[richest] = (dist[richest] || 0) + dist[poorest];
                            delete dist[poorest];
                        }
                    });
                } else if (this.relations && this.relations[`${richest}-${poorest}`] > 500) {
                    // Tarefa 27: Assimilação Pacífica
                    // Se as relações comerciais forem absurdamente altas, unem-se voluntariamente
                    if (engine.onEvent) {
                        const rData = FactionsData.getFaction(richest);
                        const pData = FactionsData.getFaction(poorest);
                        engine.onEvent({ message: `🕊️ ASSIMILAÇÃO PACÍFICA: A população de ${pData.name} abraçou os costumes de ${rData.name} após séculos de comércio e paz.`, color: '#00ff88' }, "milestone");
                    }
                    
                    engine.nodes.forEach(node => {
                        if (!node.infected) return;
                        const dist = node.demographics.dist.factions;
                        if (dist[poorest]) {
                            dist[richest] = (dist[richest] || 0) + dist[poorest];
                            delete dist[poorest];
                        }
                    });
                    
                    // Zera a relação para não trigar infinitamente
                    this.relations[`${richest}-${poorest}`] = 0;
                }
            }

            // --- Tarefa 28: Espionagem Industrial ---
            // Facções menores roubam Trust das maiores passivamente
            if (activeFactions.length > 1) {
                const richest = activeFactions[0]; // array já tá ordenado por riqueza acima
                for (let i = 1; i < activeFactions.length; i++) {
                    const spyFac = activeFactions[i];
                    const spyData = FactionsData.getFaction(spyFac);
                    // Facções não-pacifistas têm chance de espionar
                    if (!spyData.traits.includes("pacifist") && Math.random() < 0.1) {
                        const stolen = this.stealTrust(richest, spyFac, 0.05); // Rouba 5% do Trust do mais rico
                        if (stolen > 0 && engine.onEvent && Math.random() < 0.3) {
                            engine.onEvent({ message: `🕵️ ESPIONAGEM: Espiões de ${spyData.name} roubaram segredos industriais e Trust de ${FactionsData.getFaction(richest).name}!`, color: '#e74c3c' }, "trade");
                        }
                    }
                }
            }
        }

        // --- Mercado Global Autônomo ---
        if (engine.day === 100 || engine.day === 250) {
            this.processTradeRoutes(engine);
        }
    }

    processTradeRoutes(engine) {
        if (!engine.tradeRoutes) return;
        
        engine.tradeRoutes.forEach(route => {
            const sourceNode = engine.nodes.get(route.sourceId);
            const targetNode = engine.nodes.get(route.targetId);
            
            if (!sourceNode || !targetNode || !sourceNode.infected || !targetNode.infected) return;
            if (sourceNode.demographics.total < 1000 || targetNode.demographics.total < 1000) return;
            
            const sourceFac = this.getDominantFaction(sourceNode);
            const targetFac = this.getDominantFaction(targetNode);
            if (!sourceFac || !targetFac) return;

            let traded = false;
            
            // Exporta Madeira em troca de Minério
            if ((sourceNode.resources.wood || 0) > 5000 && (targetNode.resources.wood || 0) < 2000 && (targetNode.resources.minerals || 0) > 2000) {
                sourceNode.resources.wood -= 1000;
                targetNode.resources.wood += 1000;
                targetNode.resources.minerals -= 500;
                sourceNode.resources.minerals += 500;
                traded = true;
            }
            // Exporta Minério em troca de Madeira
            else if ((sourceNode.resources.minerals || 0) > 5000 && (targetNode.resources.minerals || 0) < 2000 && (targetNode.resources.wood || 0) > 2000) {
                sourceNode.resources.minerals -= 1000;
                targetNode.resources.minerals += 1000;
                targetNode.resources.wood -= 500;
                sourceNode.resources.wood += 500;
                traded = true;
            }

            if (traded) {
                this.addTrust(sourceFac, 100);
                this.addTrust(targetFac, 100);
                
                const relKey1 = `${sourceFac}-${targetFac}`;
                const relKey2 = `${targetFac}-${sourceFac}`;
                if (!this.relations) this.relations = {};
                this.relations[relKey1] = (this.relations[relKey1] || 0) + 50;
                this.relations[relKey2] = (this.relations[relKey2] || 0) + 50;

                const sourceData = FactionsData.getFaction(sourceFac);
                const targetData = FactionsData.getFaction(targetFac);

                if (Math.random() < 0.2 && engine.onEvent) {
                    engine.onEvent({ 
                        message: `🚢 EXPORTAÇÃO: ${sourceData.name} e ${targetData.name} estabeleceram troca de recursos e confiança mútua.`,
                        sourceId: sourceNode.id,
                        targetId: targetNode.id,
                        type: route.type
                    }, "trade");
                }
            }
        });
    }

    getDominantFaction(node) {
        let max = 0;
        let dom = null;
        for (const [fac, pct] of Object.entries(node.demographics.dist.factions)) {
            if (pct > max) { max = pct; dom = fac; }
        }
        return dom;
    }
}
