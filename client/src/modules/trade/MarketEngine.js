/**
 * MarketEngine — Economia real com preços dinâmicos e oferta/demanda.
 * 
 * Inspirações: Victoria 3 (market simulation), Stellaris (galactic market),
 *              Real economics (supply/demand, inflation)
 * 
 * Goods: food, wood, minerals, luxury, weapons, medicine
 * Preços sobem quando demanda > oferta, descem quando oferta > demanda.
 * Inflação emerge quando money supply cresce sem GDP real.
 */
export default {
    id: 'market_engine',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (engine.day % 30 !== 0) return; // Mensal
        if (!node.infected) return;
        
        // Inicializa mercado global
        if (!engine.market) {
            engine.market = {
                prices: { food: 1.0, wood: 1.0, minerals: 2.0, luxury: 5.0, weapons: 10.0, medicine: 3.0 },
                supply: { food: 0, wood: 0, minerals: 0, luxury: 0, weapons: 0, medicine: 0 },
                demand: { food: 0, wood: 0, minerals: 0, luxury: 0, weapons: 0, medicine: 0 },
                gdp: 0,
                inflation: 1.0,
                moneySupply: 1000,
                tradeVolume: 0
            };
        }
        
        // Só processa uma vez por tick global
        if (engine._marketProcessed === engine.year + '_' + engine.day) return;
        engine._marketProcessed = engine.year + '_' + engine.day;
        
        const m = engine.market;
        
        // ========================================
        // CALCULAR OFERTA E DEMANDA GLOBAL
        // ========================================
        m.supply = { food: 0, wood: 0, minerals: 0, luxury: 0, weapons: 0, medicine: 0 };
        m.demand = { food: 0, wood: 0, minerals: 0, luxury: 0, weapons: 0, medicine: 0 };
        
        engine.nodes.forEach(n => {
            if (!n.infected) return;
            const pop = n.demographics.total;
            
            // Demanda base (o que a pop consome)
            m.demand.food += Math.floor(pop * 0.001);
            m.demand.wood += Math.floor(pop * 0.0005);
            m.demand.minerals += Math.floor(pop * 0.0002);
            m.demand.medicine += pop > 10000 ? Math.floor(pop * 0.0001) : 0;
            
            // Luxury demand cresce com morale alta
            if ((n.morale || 50) > 60) {
                m.demand.luxury += Math.floor(pop * 0.0001);
            }
            
            // Weapons demand em conflito
            if ((n.veteranBuff || 0) > 0) {
                m.demand.weapons += Math.floor(pop * 0.0003);
            }
            
            // Oferta = o que o hex produz
            m.supply.food += (n.food || 0) > pop ? Math.floor(((n.food || 0) - pop) * 0.01) : 0;
            m.supply.wood += n.resources?.wood > 5000 ? Math.floor(n.resources.wood * 0.001) : 0;
            m.supply.minerals += n.resources?.minerals > 3000 ? Math.floor(n.resources.minerals * 0.001) : 0;
        });
        
        // Inventário global como oferta
        m.supply.food += Math.floor((engine.inventory.food || 0) * 0.1);
        m.supply.wood += Math.floor(engine.inventory.wood * 0.1);
        m.supply.minerals += Math.floor(engine.inventory.minerals * 0.1);
        
        // ========================================
        // ATUALIZAR PREÇOS (oferta/demanda)
        // ========================================
        for (const good of Object.keys(m.prices)) {
            const supply = Math.max(1, m.supply[good]);
            const demand = Math.max(1, m.demand[good]);
            const ratio = demand / supply;
            
            // Preço se move em direção ao equilíbrio
            const targetPrice = ratio * m.inflation;
            m.prices[good] += (targetPrice - m.prices[good]) * 0.1; // 10% por mês
            m.prices[good] = Math.max(0.1, Math.min(100, m.prices[good]));
        }
        
        // ========================================
        // GDP = soma de toda produção × preços
        // ========================================
        m.gdp = 0;
        for (const good of Object.keys(m.supply)) {
            m.gdp += m.supply[good] * m.prices[good];
        }
        
        // ========================================
        // INFLAÇÃO
        // ========================================
        // Money supply cresce com pop
        m.moneySupply += Math.floor(engine.globalPop * 0.001);
        
        // Inflação = money supply vs GDP
        if (m.gdp > 0) {
            const targetInflation = m.moneySupply / (m.gdp * 10 + 1);
            m.inflation += (targetInflation - m.inflation) * 0.05;
            m.inflation = Math.max(0.5, Math.min(10, m.inflation));
        }
        
        // Hiperinflação catastrófica (>5×)
        if (m.inflation > 5 && Math.random() < 0.01) {
            engine.globalTrust = Math.max(5, engine.globalTrust - 20);
            engine.pressures.social += 1.0;
            if (engine.onEvent) {
                engine.onEvent({
                    message: `💸 HIPERINFLAÇÃO: A moeda perdeu ${Math.floor((m.inflation - 1) * 100)}% do valor! Confiança em colapso.`,
                    type: 'disaster', color: '#e74c3c'
                }, 'disaster');
            }
            // Reset parcial
            m.moneySupply = Math.floor(m.moneySupply * 0.3);
            m.inflation = 2.0;
        }
        
        // ========================================
        // TRADE VOLUME (indica saúde econômica)
        // ========================================
        m.tradeVolume = 0;
        for (const good of Object.keys(m.supply)) {
            m.tradeVolume += Math.min(m.supply[good], m.demand[good]);
        }
        
        // Trade alto = bonus de DNA (economia forte)
        if (m.tradeVolume > 100) {
            engine.adaptationPoints += Math.floor(m.tradeVolume * 0.01);
        }
    }
};
