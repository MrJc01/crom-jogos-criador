/**
 * FarmingEngine — Sistema de comida real com agricultura, pecuária e fome.
 * 
 * Inspirações: Dwarf Fortress (variedade, alcohol), Civ6 (farms, irrigation)
 * 
 * Fluxo: Hex tem bioma → crops disponíveis → workers plantam → food gerada
 *        → pop consome food diariamente → sem food = famine → mortes
 */
export default {
    id: 'farming_engine',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        // Inicializa food no hex se não existir
        if (node.food === undefined) node.food = 0;
        if (!node.crops) node.crops = [];
        if (node.livestock === undefined) node.livestock = 0;
        if (node.famineDays === undefined) node.famineDays = 0;
        if (node.wildGame === undefined) node.wildGame = 100; // Caça disponível
        
        const pop = node.demographics.total;
        const workers = Math.floor(pop * (node.demographics.dist?.age?.adult || 0.4));
        const biome = node.biome?.id || 'plains';
        
        // ========================================
        // FASE 1: Produção de Comida
        // ========================================
        
        const deltaDays = globalRules.deltaDays || 1;
        
        // A. Caça e Coleta (Sempre ativo)
        const hasAgri = engine.unlockedTechs?.has('agriculture');
        // Se tem agricultura, apenas 15% da força de trabalho foca em caça como rede de segurança
        const huntingWorkers = hasAgri ? Math.max(1, Math.floor(workers * 0.15)) : workers;
        const hunters = Math.min(huntingWorkers, 100); // Max 100 caçadores por hex
        
        // Ecosystem hunting is scaled over time.
        const hunted = Math.min(hunters * 5 * deltaDays, node.wildGame * 5 * deltaDays);
        node.food += Math.floor(hunted);
        // Redução proporcional à pressão de caça vs tempo
        node.wildGame = Math.max(0, node.wildGame - (hunters / 100) * deltaDays);
        // Regeneração natural da fauna
        node.wildGame = Math.min(100, node.wildGame + 0.5 * deltaDays);
        
        if (hasAgri) {
            // B. Agricultura
            // Trabalhadores restantes vão para as fazendas
            const agriWorkers = Math.max(1, workers - huntingWorkers);
            const farmWorkers = pop < 10 ? Math.max(1, workers) : agriWorkers;
            
            // Detecta season
            const day = engine.day || 0;
            const isSummer = day >= 91 && day <= 180;
            const isWinter = day >= 271;
            const seasonKey = isSummer ? 'summer' : (isWinter ? 'winter' : 'summer');
            
            // Auto-seleciona crops por bioma (se não tem crop escolhido)
            if (node.crops.length === 0) {
                const cropTypes = { 
                    plains: ['wheat', 'potato'], jungle: ['rice', 'corn'], 
                    tundra: ['potato'], desert: ['dates'] 
                };
                node.crops = cropTypes[biome] || ['wheat'];
            }
            
            // Produção por crop
            const cropYields = {
                wheat: 50, rice: 70, potato: 40, corn: 60, dates: 20, berries: 15
            };
            const cropWater = {
                wheat: 2, rice: 5, potato: 1, corn: 3, dates: 4, berries: 1
            };
            const seasonBonus = {
                wheat: { summer: 1.3, winter: 0.3 },
                rice: { summer: 1.5, winter: 0.1 },
                potato: { summer: 1.1, winter: 0.7 },
                corn: { summer: 1.4, winter: 0.2 },
                dates: { summer: 1.0, winter: 0.8 },
                berries: { summer: 1.5, winter: 0.0 }
            };
            
            let totalFoodProduced = 0;
            const workersPerCrop = Math.floor(farmWorkers / node.crops.length);
            
            for (const crop of node.crops) {
                const baseYield = cropYields[crop] || 30;
                const waterNeeded = (cropWater[crop] || 2) * workersPerCrop / 1000;
                const sMult = seasonBonus[crop]?.[seasonKey] || 1.0;
                
                // Restrição de Bioma
                if (biome === 'desert' && !engine.unlockedTechs?.has('qanat_irrigation')) {
                    continue; // Sem colheita no deserto sem tecnologia
                }
                
                // Irrigação boost
                let irrigMult = 1.0;
                if (engine.unlockedTechs?.has('saneamento_basico')) irrigMult = 1.5;
                if (engine.unlockedTechs?.has('arquitetura_vertical')) irrigMult = 2.0;
                
                // Solo afeta yield
                const soilMult = Math.max(0.1, (node.soil || 50) / 100);
                
                // Água disponível?
                const waterAvail = node.resources?.water || 0;
                const waterMult = waterAvail > waterNeeded * 100 ? 1.0 : 
                                  waterAvail > 0 ? waterAvail / (waterNeeded * 100) : 0.1;
                
                const exactCrop = workersPerCrop * (baseYield / 365) * sMult * irrigMult * soilMult * waterMult * deltaDays;
                let foodFromCrop = Math.floor(exactCrop);
                if (Math.random() < (exactCrop % 1)) foodFromCrop += 1;
                
                totalFoodProduced += foodFromCrop;
                
                // Consome água para irrigação
                if (node.resources) {
                    node.resources.water = Math.max(0, node.resources.water - Math.floor(waterNeeded * deltaDays));
                }
            }
            
            node.food += totalFoodProduced;
            
            // C. Pecuária
            if (node.livestock > 0) {
                // Animais produzem food mas consomem food
                const livestockFood = Math.floor(node.livestock * 15 / 365 * deltaDays); // 15 food/ano por animal
                const livestockCost = Math.floor(node.livestock * 8 / 365 * deltaDays); // 8 food/ano custo
                node.food += (livestockFood - livestockCost);
                
                // Crescimento do rebanho (se tem food sobrando)
                if (node.food > pop * 2 && Math.random() < 0.001) {
                    node.livestock = Math.min(node.livestock + 1, Math.floor(pop / 10)); // Max 10% da pop
                }
            }
            
            // Auto-domesticar animais quando tem agricultura + pop > 500
            if (node.livestock === 0 && pop > 500 && Math.random() < 0.001) {
                node.livestock = 1;
                if (engine.onEvent) {
                    engine.onEvent({ message: `🐄 DOMESTICAÇÃO: ${node.name} domesticou seus primeiros animais!`, nodeId: node.id, type: 'milestone', color: '#8b4513' }, 'milestone');
                }
            }
        }
        
        // ========================================
        // FASE 2: Consumo de Comida
        // ========================================
        const dist = node.demographics.dist?.age || { child: 0.2, young: 0.3, adult: 0.4, elder: 0.1 };
        const exactConsumption = pop * (dist.child * 0.5 + dist.young * 1.0 + dist.adult * 1.0 + dist.elder * 0.7) / 365 * deltaDays;
        let dailyConsumption = Math.floor(exactConsumption);
        if (Math.random() < (exactConsumption % 1)) dailyConsumption += 1;
        
        node.food -= dailyConsumption;
        
        // Adiciona food ao inventário global (excedente)
        if (node.food > pop * 5) {
            const surplus = Math.floor((node.food - pop * 5) * 0.1);
            engine.inventory.food = (engine.inventory.food || 0) + surplus;
            node.food -= surplus;
        }
        
        // ========================================
        // FASE 3: Fome e Morte
        // ========================================
        if (node.food <= 0) {
            node.food = 0;
            node.famineDays += deltaDays;
            
            // Após 60 dias sem comida, começa a morrer (mais clemência)
            if (node.famineDays > 60) {
                const deathRate = pop < 1000 ? 0.001 : 0.005; // Menor para pops pequenas
                const exactDeaths = pop * deathRate * deltaDays;
                let deaths = Math.floor(exactDeaths);
                if (Math.random() < (exactDeaths % 1)) deaths += 1;
                deaths = Math.min(Math.floor(pop * 0.9), deaths);
                
                node.demographics.kill(deaths);
                
                // Primeiro aviso
                if (node.famineDays - deltaDays <= 60 && engine.onEvent) {
                    engine.onEvent({ 
                        message: `🍞 FOME SEVERA: ${node.name} está sem comida. Mortes por inanição começaram.`, 
                        nodeId: node.id, type: 'disaster', color: '#8b0000' 
                    }, 'disaster');
                    engine.logEvent?.({ message: `🍞 Fome em ${node.name}` }, 'disaster');
                }
            }
            
            // Canibalismo em fome extrema (90+ dias)
            if (node.famineDays > 90 && Math.random() < 0.01) {
                node.food += Math.floor(pop * 0.01); // Triste mas historicamente preciso
                engine.pressures.social += 1.0;
                if (engine.onEvent) {
                    engine.onEvent({ 
                        message: `💀 CANIBALISMO: A fome em ${node.name} levou ao impensável. A sociedade quebrou.`, 
                        nodeId: node.id, type: 'nemesis', color: '#660000' 
                    }, 'nemesis');
                }
            }
        } else {
            node.famineDays = 0;
        }
        
        // Food decay (apodrece cumulativamente por deltaDays)
        node.food = Math.max(0, Math.floor(node.food * Math.pow(0.998, deltaDays))); // 0.2% decay/dia
        
        // ========================================
        // FASE 4: Morale Impact (food variety)
        // ========================================
        if (!node.moraleFactors) node.moraleFactors = {};
        node.moraleFactors.food = node.food > 0 ? 
            (node.crops.length >= 3 ? 5 : (node.crops.length >= 2 ? 0 : -5)) +
            (node.livestock > 0 ? 3 : 0) +
            (node.famineDays > 0 ? -20 : 10) : -25;
    }
};
