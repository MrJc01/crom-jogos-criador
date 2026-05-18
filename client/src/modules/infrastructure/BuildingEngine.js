/**
 * BuildingEngine — Construção autônoma de estruturas, maravilhas e infra.
 * 
 * Inspirações: Civ6 (Wonders), Dwarf Fortress (workshops/rooms),
 *              Age of Empires (buildings = progression)
 * 
 * Zero-Player: Facções constroem automaticamente baseado em necessidade.
 * Prioridade: Farm > Hospital > School > Temple > Market > Fort
 */
export default {
    id: 'building_engine',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day !== 1) return; // Mensal (dia 1 de cada mês)
        
        // Inicializa
        if (!node.buildings) node.buildings = {};
        if (!engine.wonders) engine.wonders = {};
        if (!node.infrastructure) node.infrastructure = {};
        
        const pop = node.demographics.total;
        
        // ========================================
        // AUTO-CONSTRUÇÃO (Zero-Player AI)
        // ========================================
        const needs = this.assessNeeds(node, engine);
        
        for (const need of needs) {
            if (this.canBuild(need.type, node, engine)) {
                this.build(need.type, node, engine);
                break; // Uma construção por mês
            }
        }
        
        // ========================================
        // MARAVILHAS (anual, global)
        // ========================================
        if (engine.day === 1 && engine.year % 5 === 0) { // A cada 5 anos
            this.checkWonders(node, engine);
        }
        
        // ========================================
        // MANUTENÇÃO (mensal)
        // ========================================
        this.processMaintenances(node, engine);
        
        // ========================================
        // INFRA: ROADS (conecta vizinhos)
        // ========================================
        if (pop > 5000 && !node.infrastructure.road) {
            if (engine.inventory.wood >= 30) {
                node.infrastructure.road = true;
                engine.inventory.wood -= 30;
            }
        }
        if (pop > 50000 && !node.infrastructure.railway && (engine.unlockedTechs?.size || 0) >= 15) {
            if (engine.inventory.minerals >= 200) {
                node.infrastructure.railway = true;
                engine.inventory.minerals -= 200;
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `🚂 FERROVIA: ${node.name} conectou-se à rede ferroviária! Comércio ×10.`,
                        nodeId: node.id, type: 'milestone', color: '#7f8c8d'
                    }, 'milestone');
                }
            }
        }
        
        // ========================================
        // APLICAR EFEITOS DOS BUILDINGS
        // ========================================
        this.applyBuildingEffects(node, engine);
    },
    
    assessNeeds(node, engine) {
        const pop = node.demographics.total;
        const needs = [];
        
        // Fome? → Farm
        if ((node.food || 0) < pop * 0.5) {
            needs.push({ type: 'farm', priority: 10 });
        }
        // Mortes altas? → Hospital  
        if (pop > 5000 && !(node.buildings.hospital > 0)) {
            needs.push({ type: 'hospital', priority: 8 });
        }
        // Morale baixo? → Tavern ou Temple
        if ((node.morale || 50) < 40) {
            needs.push({ type: 'tavern', priority: 7 });
            if (node.religion?.active) needs.push({ type: 'temple', priority: 7 });
        }
        // Literacy baixo? → School
        if ((engine.literacy || 5) < 50 && pop > 2000) {
            needs.push({ type: 'school', priority: 6 });
        }
        // Comércio → Market
        if (pop > 10000) {
            needs.push({ type: 'market', priority: 5 });
        }
        // Comida apodrece → Granary
        if ((node.food || 0) > pop * 3 && !(node.buildings.granary > 0)) {
            needs.push({ type: 'granary', priority: 4 });
        }
        // Seca → Aqueduct
        if ((node.resources?.water || 0) < 1000 && !(node.buildings.aqueduct > 0)) {
            needs.push({ type: 'aqueduct', priority: 9 });
        }
        // Defesa → Fort/Wall (se guerra recente)
        if ((node.veteranBuff || 0) > 0.5 && !(node.buildings.fort > 0)) {
            needs.push({ type: 'fort', priority: 6 });
        }
        // Mineração → Mine
        if ((node.resources?.minerals || 0) > 5000 && (node.buildings.mine || 0) < 3) {
            needs.push({ type: 'mine', priority: 5 });
        }
        
        needs.sort((a, b) => b.priority - a.priority);
        return needs;
    },
    
    canBuild(type, node, engine) {
        const costs = {
            farm: { wood: 50 }, mine: { wood: 100 }, temple: { wood: 200, minerals: 100 },
            market: { wood: 80 }, fort: { minerals: 300 }, school: { wood: 100 },
            hospital: { wood: 150, minerals: 50 }, tavern: { wood: 50 },
            aqueduct: { minerals: 200 }, granary: { wood: 80 }, wall: { minerals: 500 },
            port: { wood: 200, minerals: 100 }
        };
        const maxPer = {
            farm: 5, mine: 3, temple: 3, market: 2, fort: 1, school: 3,
            hospital: 2, tavern: 3, aqueduct: 1, granary: 2, wall: 1, port: 1
        };
        
        const cost = costs[type];
        if (!cost) return false;
        
        // Check max
        if ((node.buildings[type] || 0) >= (maxPer[type] || 1)) return false;
        
        // Check resources
        for (const [res, amount] of Object.entries(cost)) {
            if ((engine.inventory[res] || 0) < amount) return false;
        }
        
        return true;
    },
    
    build(type, node, engine) {
        const costs = {
            farm: { wood: 50 }, mine: { wood: 100 }, temple: { wood: 200, minerals: 100 },
            market: { wood: 80 }, fort: { minerals: 300 }, school: { wood: 100 },
            hospital: { wood: 150, minerals: 50 }, tavern: { wood: 50 },
            aqueduct: { minerals: 200 }, granary: { wood: 80 }, wall: { minerals: 500 },
            port: { wood: 200, minerals: 100 }
        };
        
        const cost = costs[type];
        for (const [res, amount] of Object.entries(cost)) {
            engine.inventory[res] = (engine.inventory[res] || 0) - amount;
        }
        
        node.buildings[type] = (node.buildings[type] || 0) + 1;
        
        const names = {
            farm: '🌾 Fazenda', mine: '⛏️ Mina', temple: '⛪ Templo', market: '🏪 Mercado',
            fort: '🏰 Forte', school: '📚 Escola', hospital: '🏥 Hospital', tavern: '🍺 Taverna',
            aqueduct: '🏗️ Aqueduto', granary: '🏺 Celeiro', wall: '🧱 Muralha', port: '⚓ Porto'
        };
        
        if (engine.onEvent) {
            engine.onEvent({
                message: `${names[type] || type}: Construído em ${node.name}! (Total: ${node.buildings[type]})`,
                nodeId: node.id, type: 'milestone', color: '#27ae60'
            }, 'milestone');
        }
    },
    
    processMaintenances(node, engine) {
        const mainCosts = {
            farm: { wood: 1 }, mine: { wood: 2 }, temple: { wood: 2 }, market: { wood: 1 },
            fort: { minerals: 1 }, school: { wood: 2 }, hospital: { wood: 2 }, tavern: { wood: 1 },
            aqueduct: { minerals: 1 }, granary: { wood: 1 }, wall: { minerals: 2 }, port: { wood: 3 }
        };
        
        for (const [type, count] of Object.entries(node.buildings)) {
            if (count <= 0) continue;
            const cost = mainCosts[type];
            if (!cost) continue;
            
            for (const [res, amount] of Object.entries(cost)) {
                const totalCost = amount * count;
                if ((engine.inventory[res] || 0) >= totalCost) {
                    engine.inventory[res] -= totalCost;
                } else {
                    // Sem manutenção = building degrada
                    node.buildings[type] = Math.max(0, count - 1);
                    break;
                }
            }
        }
    },
    
    checkWonders(node, engine) {
        const pop = node.demographics.total;
        const techs = engine.unlockedTechs?.size || 0;
        
        const wonders = [
            { id: 'pyramids', name: 'Pirâmides', cost: { minerals: 2000 }, minPop: 10000, minTechs: 3 },
            { id: 'great_library', name: 'Grande Biblioteca', cost: { wood: 1500, minerals: 500 }, minPop: 20000, minTechs: 8 },
            { id: 'colosseum', name: 'Coliseu', cost: { minerals: 3000 }, minPop: 50000, minTechs: 12 },
            { id: 'great_wall', name: 'Grande Muralha', cost: { minerals: 5000 }, minPop: 100000, minTechs: 10 },
            { id: 'printing_press', name: 'Prensa de Gutenberg', cost: { minerals: 1000, wood: 500 }, minPop: 50000, minTechs: 15 },
            { id: 'internet', name: 'Internet Global', cost: { chips: 100, computers: 50 }, minPop: 500000, minTechs: 30 }
        ];
        
        for (const w of wonders) {
            if (engine.wonders[w.id]) continue; // Já construída
            if (pop < w.minPop || techs < w.minTechs) continue;
            
            let canAfford = true;
            for (const [res, amount] of Object.entries(w.cost)) {
                if ((engine.inventory[res] || 0) < amount) { canAfford = false; break; }
            }
            if (!canAfford) continue;
            
            // Constrói!
            for (const [res, amount] of Object.entries(w.cost)) {
                engine.inventory[res] -= amount;
            }
            engine.wonders[w.id] = { builtBy: node.id, year: engine.year };
            
            if (engine.onEvent) {
                engine.onEvent({
                    message: `🏛️ MARAVILHA DO MUNDO: "${w.name}" foi erguida em ${node.name}! Este feito será lembrado por milênios.`,
                    nodeId: node.id, type: 'milestone', color: '#f39c12'
                }, 'milestone');
                engine.logEvent?.({ message: `🏛️ Maravilha: ${w.name}` }, 'wonder');
            }
            break; // Uma maravilha por check
        }
    },
    
    applyBuildingEffects(node, engine) {
        if (!node.moraleFactors) node.moraleFactors = {};
        
        let morale = 0;
        morale += (node.buildings.temple || 0) * 10;
        morale += (node.buildings.tavern || 0) * 8;
        morale += (node.buildings.market || 0) * 5;
        morale += (node.buildings.granary || 0) * 2;
        
        node.moraleFactors.buildings = morale;
        
        // Farm boost na capacidade
        if (node.buildings.farm > 0) {
            node.capacity = Math.floor((node.capacity || 50000) * (1 + node.buildings.farm * 0.05));
        }
        
        // Aqueduct boost de água
        if (node.buildings.aqueduct > 0 && node.resources) {
            node.resources.water = Math.min(100000, (node.resources.water || 0) + 5);
        }
    }
};
