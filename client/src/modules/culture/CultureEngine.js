/**
 * CultureEngine — Cultura, influência e identidade de facções.
 * 
 * Inspirações: Civ6 (tourism/culture victory), Stellaris (ethics attraction),
 *              Jared Diamond (cultura como resistência à adaptação)
 * 
 * Cultura se acumula e ESPALHA para hexes vizinhos.
 * Facção com cultura dominante pode CONVERTER pops sem guerra.
 * Cultura alta = RIGIDEZ (difícil mudar de governo/tech).
 */
export default {
    id: 'culture_engine',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 30 !== 0) return; // Mensal
        
        // Inicializa
        if (node.cultureLevel === undefined) node.cultureLevel = 0;
        if (!node.culturalInfluence) node.culturalInfluence = {};
        if (!node.artworks) node.artworks = 0;
        if (!node.monuments) node.monuments = 0;
        
        const pop = node.demographics.total;
        const literacy = engine.literacy || 5;
        const morale = node.morale || 50;
        
        // ========================================
        // GERAÇÃO DE CULTURA
        // ========================================
        // Cultura = pop × literacy × morale × (religion + art)
        const baseGen = pop * 0.00001;
        const literacyMult = 1 + (literacy / 100);
        const moraleMult = morale > 50 ? 1.2 : 0.8;
        const artMult = 1 + (node.artworks * 0.1) + (node.monuments * 0.3);
        
        const cultureGen = baseGen * literacyMult * moraleMult * artMult;
        node.cultureLevel += cultureGen;
        
        // Cap de cultura
        node.cultureLevel = Math.min(100, node.cultureLevel);
        
        // ========================================
        // SPREAD DE INFLUÊNCIA (para vizinhos)
        // ========================================
        const dominantFaction = this.getDominantFaction(node);
        if (dominantFaction && node.cultureLevel > 5) {
            const neighbors = node.neighbors || [];
            for (const nId of neighbors) {
                const neighbor = engine.nodes.get(nId);
                if (!neighbor?.infected) continue;
                
                // Influência cresce com diferença de cultura
                const neighborCulture = neighbor.cultureLevel || 0;
                if (node.cultureLevel > neighborCulture + 3) {
                    if (!neighbor.culturalInfluence) neighbor.culturalInfluence = {};
                    neighbor.culturalInfluence[dominantFaction] = 
                        (neighbor.culturalInfluence[dominantFaction] || 0) + (node.cultureLevel * 0.001);
                }
            }
        }
        
        // ========================================
        // CONVERSÃO CULTURAL (sem guerra!)
        // ========================================
        if (Object.keys(node.culturalInfluence).length > 0) {
            for (const [facId, influence] of Object.entries(node.culturalInfluence)) {
                if (influence > 10 && node.demographics.dist?.factions) {
                    const currentPct = node.demographics.dist.factions[facId] || 0;
                    if (currentPct < 0.5) { // Só converte até 50%
                        // Conversão gradual: 0.1% da pop por mês
                        const conversionRate = 0.001;
                        const otherFactions = Object.keys(node.demographics.dist.factions).filter(f => f !== facId);
                        if (otherFactions.length > 0) {
                            const target = otherFactions[0];
                            const transfer = Math.min(conversionRate, node.demographics.dist.factions[target] || 0);
                            node.demographics.dist.factions[target] = Math.max(0, (node.demographics.dist.factions[target] || 0) - transfer);
                            node.demographics.dist.factions[facId] = (node.demographics.dist.factions[facId] || 0) + transfer;
                        }
                    }
                }
                
                // Influence decai
                node.culturalInfluence[facId] = Math.max(0, influence - 0.1);
            }
        }
        
        // ========================================
        // PRODUÇÃO DE ARTE (Zero-Player)
        // ========================================
        if (morale > 60 && literacy > 20 && pop > 2000) {
            // 0.1% chance mensal de criar uma obra de arte
            if (Math.random() < 0.001) {
                node.artworks++;
                const artTypes = ['pintura rupestre', 'escultura', 'poema épico', 'ópera', 'tratado filosófico', 'mural sagrado'];
                const art = artTypes[Math.min(artTypes.length - 1, Math.floor(literacy / 20))];
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `🎨 ARTE: Um artista em ${node.name} criou uma ${art}! Cultura +1.`,
                        nodeId: node.id, type: 'milestone', color: '#e67e22'
                    }, 'milestone');
                }
            }
        }
        
        // ========================================
        // MONUMENTOS (construção permanente)
        // ========================================
        if (node.cultureLevel > 20 && pop > 10000 && node.monuments < 3) {
            if (engine.inventory.minerals > 500 && Math.random() < 0.002) {
                node.monuments++;
                engine.inventory.minerals -= 500;
                const monumentTypes = ['Obelisco', 'Estátua Colossal', 'Arco do Triunfo', 'Biblioteca', 'Pirâmide'];
                const mon = monumentTypes[Math.floor(Math.random() * monumentTypes.length)];
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `🏛️ MONUMENTO: ${node.name} ergueu "${mon}"! Cultura e morale +5.`,
                        nodeId: node.id, type: 'milestone', color: '#d35400'
                    }, 'milestone');
                }
                node.moraleFactors = node.moraleFactors || {};
                node.moraleFactors.monument = node.monuments * 3;
            }
        }
        
        // ========================================
        // RIGIDEZ CULTURAL (Diamond: cultura impede adaptação)
        // ========================================
        if (node.cultureLevel > 50) {
            // Alta cultura = difícil mudar tech/governo
            // Implementado como resistance a mudança
            node.culturalRigidity = node.cultureLevel * 0.01; // 0-1
        }
    },
    
    getDominantFaction(node) {
        if (!node.demographics.dist?.factions) return null;
        let maxPct = 0;
        let dominant = null;
        for (const [fac, pct] of Object.entries(node.demographics.dist.factions)) {
            if (pct > maxPct) { maxPct = pct; dominant = fac; }
        }
        return dominant;
    }
};
