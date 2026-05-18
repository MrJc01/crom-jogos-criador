/**
 * MoraleEngine — Felicidade/Morale LOCAL por hex.
 * 
 * Inspirações: Dwarf Fortress (thoughts/memories), Civ6 (amenities), 
 *              Stellaris (pop happiness)
 * 
 * Morale 0-100:
 *   0-20  = Rebelião (revolta, mortes)
 *   20-35 = Descontentamento (produção -30%)
 *   35-50 = Inquietação (produção -10%)
 *   50-65 = Estável (normal)
 *   65-80 = Contente (produção +10%)
 *   80+   = Era de Ouro (produção +50%, pesquisa +30%)
 */
export default {
    id: 'morale_engine',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 7 !== 0) return; // Semanal (performance)
        
        // Inicializa morale
        if (node.morale === undefined) node.morale = 50;
        if (!node.moraleFactors) node.moraleFactors = {};
        if (node.amenities === undefined) node.amenities = [];
        if (node.crime === undefined) node.crime = 0;
        
        const pop = node.demographics.total;
        const cap = node.capacity || 50000;
        
        // ========================================
        // CÁLCULO DE MORALE (Fórmula Aditiva)
        // ========================================
        let targetMorale = 50; // Baseline
        
        // 1. COMIDA — Fator mais impactante
        const foodFactor = node.moraleFactors?.food || 0;
        targetMorale += foodFactor;
        
        // 2. SUPERLOTAÇÃO
        const crowdRatio = pop / cap;
        if (crowdRatio > 0.85) targetMorale -= 15;
        else if (crowdRatio > 0.7) targetMorale -= 5;
        
        // 3. GUERRA
        if (node.veteranBuff > 0) targetMorale -= 10; // Zona de conflito recente
        
        // 4. PANDEMIA
        if (node.sir?.active) targetMorale -= 25;
        
        // 5. DESASTRES RECENTES
        if (node.lastDisasterYear && engine.year - node.lastDisasterYear < 5) {
            targetMorale -= 15;
        }
        
        // 6. AMENIDADES (tavernas, parques, teatros)
        for (const amenity of node.amenities) {
            const bonuses = { tavern: 8, park: 5, theater: 10, bathhouse: 7, arena: 12 };
            targetMorale += bonuses[amenity] || 3;
        }
        
        // 7. TRUST (nacional)
        if (engine.globalTrust > 120) targetMorale += 5;
        else if (engine.globalTrust < 30) targetMorale -= 10;
        
        // 8. RELIGIÃO (se existir)
        if (node.religion?.active) targetMorale += 10;
        
        // 9. GOVERNO
        const gov = engine.currentGovernment;
        if (gov?.modifiers?.moraleBonus) targetMorale += gov.modifiers.moraleBonus;
        if (gov?.modifiers?.moralePenalty) targetMorale += gov.modifiers.moralePenalty;
        
        // 10. CULTURA
        if (node.cultureLevel > 5) targetMorale += 3;
        
        // 11. CRIME (reduz morale)
        targetMorale -= node.crime * 3;
        
        // Clamp 0-100
        targetMorale = Math.max(0, Math.min(100, targetMorale));
        
        // Morale se move lentamente em direção ao target (inércia)
        const moraleSpeed = 0.05; // 5% por semana
        node.morale += (targetMorale - node.morale) * moraleSpeed;
        node.morale = Math.max(0, Math.min(100, node.morale));
        
        // ========================================
        // EFEITOS DA MORALE
        // ========================================
        
        // REBELIÃO (morale < 20)
        if (node.morale < 20) {
            if (Math.random() < 0.005) { // 0.5% por semana
                const killed = Math.floor(pop * 0.10);
                node.demographics.kill(killed);
                engine.pressures.social += 1.0;
                if (engine.onEvent) {
                    engine.onEvent({ 
                        message: `😡 REVOLTA POPULAR: O povo de ${node.name} se rebelou contra a ordem vigente! ${killed} mortos.`, 
                        nodeId: node.id, type: 'nemesis', color: '#c0392b' 
                    }, 'nemesis');
                    engine.logEvent?.({ message: `😡 Revolta em ${node.name}` }, 'disaster');
                }
            }
        }
        
        // ERA DE OURO (morale > 80 por 1+ ano)
        if (node.morale > 80) {
            if (!node.goldenAgeStart) node.goldenAgeStart = engine.year;
            if (engine.year - node.goldenAgeStart >= 1 && !node.inGoldenAge) {
                node.inGoldenAge = true;
                if (engine.onEvent) {
                    engine.onEvent({ 
                        message: `✨ ERA DE OURO: ${node.name} entrou em uma era de prosperidade sem precedentes! Produção +50%.`, 
                        nodeId: node.id, type: 'milestone', color: '#f1c40f' 
                    }, 'milestone');
                }
            }
        } else {
            node.goldenAgeStart = null;
            if (node.inGoldenAge) {
                node.inGoldenAge = false;
                if (engine.onEvent) {
                    engine.onEvent({ 
                        message: `📉 FIM DA ERA DE OURO: ${node.name} perdeu sua prosperidade.`, 
                        nodeId: node.id, type: 'warning', color: '#888' 
                    }, 'warning');
                }
            }
        }
        
        // ========================================
        // CRIME (emerge de baixa morale + overcrowding)
        // ========================================
        const baseCrime = 0.01;
        const moraleCrimeFactor = Math.max(0, (50 - node.morale) * 0.001);
        const crowdCrime = crowdRatio > 0.8 ? (crowdRatio - 0.8) * 0.02 : 0;
        
        node.crime = Math.max(0, Math.min(10, node.crime + baseCrime + moraleCrimeFactor + crowdCrime - 0.005));
        
        // Crime mata people lentamente
        if (node.crime > 2) {
            const crimeDeaths = Math.floor(pop * node.crime * 0.0001);
            if (crimeDeaths > 0) node.demographics.kill(crimeDeaths);
        }
        
        // ========================================
        // AUTO-CONSTRUÇÃO DE AMENIDADES (Zero-Player)
        // ========================================
        if (engine.day === 1 && pop > 1000 && node.amenities.length < 5) {
            // Facções constroem amenidades automaticamente quando têm recursos
            if (node.morale < 40 && engine.inventory.wood > 50) {
                const options = ['tavern', 'park', 'theater'];
                const choice = options[Math.floor(Math.random() * options.length)];
                if (!node.amenities.includes(choice)) {
                    node.amenities.push(choice);
                    engine.inventory.wood -= 50;
                    if (engine.onEvent) {
                        engine.onEvent({ 
                            message: `🏗️ CONSTRUÇÃO: ${node.name} construiu uma ${choice} para melhorar a moral!`, 
                            nodeId: node.id, type: 'milestone', color: '#27ae60' 
                        }, 'milestone');
                    }
                }
            }
        }
        
        // Manutenção de amenidades (consome recursos)
        if (engine.day % 30 === 0) {
            for (let i = node.amenities.length - 1; i >= 0; i--) {
                if (engine.inventory.wood < 1) {
                    // Sem manutenção = amenidade degradada
                    node.amenities.splice(i, 1);
                } else {
                    engine.inventory.wood -= 1;
                }
            }
        }
    }
};
