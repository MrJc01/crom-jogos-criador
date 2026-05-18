/**
 * N07. AmenitiesEngine — Amenidades autônomas para boost de morale.
 * N08. FestivalEngine — Festivais cíclicos e jogos olímpicos.
 * 
 * Combinados em um único módulo para performance.
 */
export default {
    id: 'amenities_festivals',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        const pop = node.demographics.total;
        
        // ========================================
        // N07: AMENIDADES
        // ========================================
        if (engine.day % 30 === 0) {
            if (!node.amenities) node.amenities = [];
            
            const amenityTypes = [
                { id: 'tavern', name: 'Taverna', cost: { wood: 50 }, morale: 8, minPop: 500 },
                { id: 'park', name: 'Praça', cost: { wood: 20 }, morale: 5, minPop: 1000 },
                { id: 'bathhouse', name: 'Banho Público', cost: { wood: 30, minerals: 20 }, morale: 7, minPop: 5000 },
                { id: 'theater', name: 'Teatro', cost: { wood: 100 }, morale: 10, minPop: 10000 },
                { id: 'arena', name: 'Arena', cost: { minerals: 200 }, morale: 12, minPop: 50000 }
            ];
            
            // Auto-construção quando morale baixo
            if ((node.morale || 50) < 45 && node.amenities.length < 5) {
                for (const a of amenityTypes) {
                    if (pop < a.minPop) continue;
                    if (node.amenities.includes(a.id)) continue;
                    
                    let canBuild = true;
                    for (const [res, amount] of Object.entries(a.cost)) {
                        if ((engine.inventory[res] || 0) < amount) { canBuild = false; break; }
                    }
                    
                    if (canBuild && Math.random() < 0.01) {
                        for (const [res, amount] of Object.entries(a.cost)) {
                            engine.inventory[res] -= amount;
                        }
                        node.amenities.push(a.id);
                        if (engine.onEvent) {
                            engine.onEvent({
                                message: `🎭 ${a.name.toUpperCase()}: Construído em ${node.name}! Morale +${a.morale}.`,
                                nodeId: node.id, type: 'milestone', color: '#9b59b6'
                            }, 'milestone');
                        }
                        break;
                    }
                }
            }
            
            // Aplica morale das amenidades
            if (!node.moraleFactors) node.moraleFactors = {};
            let amenityMorale = 0;
            for (const a of node.amenities) {
                const def = amenityTypes.find(t => t.id === a);
                if (def) amenityMorale += def.morale;
            }
            node.moraleFactors.amenities = amenityMorale;
        }
        
        // ========================================
        // N08: FESTIVAIS
        // ========================================
        if (!node.festival) node.festival = { active: false, daysLeft: 0, type: null };
        
        // Festival ativo
        if (node.festival.active) {
            node.festival.daysLeft--;
            if (!node.moraleFactors) node.moraleFactors = {};
            node.moraleFactors.festival = 15;
            
            // Festival consome food
            if (node.food !== undefined) {
                node.food -= Math.floor(pop * 0.001);
            }
            
            if (node.festival.daysLeft <= 0) {
                node.festival.active = false;
                node.moraleFactors.festival = 0;
            }
            return;
        }
        
        // Iniciar festival (a cada ~90 dias se morale > 45)
        if (engine.day % 90 === 0 && (node.morale || 50) > 45 && pop > 500) {
            if ((node.food || 0) > pop * 2 && Math.random() < 0.3) {
                const festTypes = [
                    { name: 'Festival da Colheita', emoji: '🌾' },
                    { name: 'Festa do Solstício', emoji: '☀️' },
                    { name: 'Jogos Atléticos', emoji: '🏅' },
                    { name: 'Feira de Artesanato', emoji: '🎨' },
                    { name: 'Celebração da Paz', emoji: '🕊️' }
                ];
                
                // Festival religioso se tem religião
                if (node.religion?.active) {
                    festTypes.push({ name: 'Peregrinação Sagrada', emoji: '🕌' });
                    festTypes.push({ name: 'Ritual de Purificação', emoji: '🔥' });
                }
                
                const fest = festTypes[Math.floor(Math.random() * festTypes.length)];
                node.festival = { active: true, daysLeft: 30, type: fest.name };
                
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `${fest.emoji} FESTIVAL: "${fest.name}" em ${node.name}! Morale +15 por 30 dias.`,
                        nodeId: node.id, type: 'milestone', color: '#e67e22'
                    }, 'milestone');
                }
                
                // Boost de piety em festivais religiosos
                if (node.religion?.active && fest.name.includes('Sagrada')) {
                    node.religion.piety = Math.min(100, (node.religion.piety || 0) + 5);
                }
            }
        }
        
        // Olimpíadas a cada 4 anos (global)
        if (engine.day === 180 && engine.year % 4 === 0 && engine.globalPop > 50000) {
            if (!engine._olympicsHeld) engine._olympicsHeld = {};
            if (!engine._olympicsHeld[engine.year]) {
                engine._olympicsHeld[engine.year] = true;
                engine.globalTrust = Math.min(200, engine.globalTrust + 10);
                engine.pressures.social = Math.max(0, engine.pressures.social - 0.5);
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `🏅 JOGOS OLÍMPICOS: Competições atléticas globais unem os povos! Trust +10.`,
                        type: 'milestone', color: '#f1c40f'
                    }, 'milestone');
                }
            }
        }
    }
};
