/**
 * 025. Atrito Militar de Retaguarda — Exércitos distantes sofrem atrito.
 * 027. Moeda Fiat vs Lastreada — Impressão de moeda digital.
 */
export default {
    id: 'military_economy',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected) return;
        if (engine.day % 30 !== 0) return; // Mensal
        
        // ============================================
        // 025. Atrito Militar de Retaguarda
        // ============================================
        // Nós distantes do "centro" (hex_0) perdem pop militar por logística
        if (node.demographics.total > 1000 && node.veteranBuff > 0) {
            // Veteranos distantes sofrem atrito (doença, fome na marcha)
            const attrition = Math.floor(node.demographics.total * 0.001 * (node.veteranBuff || 0));
            if (attrition > 0) {
                node.demographics.kill(Math.min(attrition, Math.floor(node.demographics.total * 0.01)));
            }
        }
        
        // ============================================
        // 027. Moeda Fiat vs Lastreada
        // ============================================
        if (!engine.monetarySystem) {
            engine.monetarySystem = { 
                type: 'commodity', // Starts as commodity money (gold/silver)
                inflation: 0.0,
                moneySUpply: 0,
                gdp: 0
            };
        }
        
        const ms = engine.monetarySystem;
        
        // GDP baseado na produção (pop × eraMult)
        ms.gdp = Math.floor(engine.globalPop * (engine.currentEra.mult || 1) * 0.01);
        
        // Transição para moeda fiat na Era Industrial+
        if (engine.currentEra.mult >= 200 && ms.type === 'commodity') {
            ms.type = 'fiat';
            if (engine.onEvent) {
                engine.onEvent({ message: `💰 MOEDA FIAT: A civilização abandonou o padrão-ouro e agora imprime dinheiro. Crescimento 2× mas risco de hiperinflação!`, type: "warning", color: "#ffdd00" }, "warning");
                engine.logEvent?.({ message: `💰 Transição para moeda fiat` }, "economy");
            }
        }
        
        // Moeda fiat: imprime dinheiro = boost GDP mas risco de inflação
        if (ms.type === 'fiat') {
            ms.moneySUpply += Math.floor(ms.gdp * 0.1); // Imprimir 10% do GDP/mês
            
            // Inflação = moneySupply / GDP real
            ms.inflation = ms.gdp > 0 ? Math.min(10.0, ms.moneySUpply / (ms.gdp * 12)) : 0;
            
            // Hiperinflação: inflação > 3.0 = colapso de trust
            if (ms.inflation > 3.0) {
                engine.globalTrust = Math.max(5, engine.globalTrust - 1);
                engine.pressures.social += 0.1;
                
                if (ms.inflation > 5.0 && Math.random() < 0.01) {
                    // Reset monetário
                    ms.moneySUpply = Math.floor(ms.gdp * 6);
                    ms.inflation = 0.5;
                    if (engine.onEvent) {
                        engine.onEvent({ message: `📉 HIPERINFLAÇÃO: A moeda perdeu 99% do valor. Reset monetário forçado! Trust em queda livre.`, type: "disaster", color: "#ff0000" }, "disaster");
                        engine.logEvent?.({ message: `📉 Hiperinflação: reset monetário` }, "hyperinflation");
                    }
                }
            }
            
            // Boost de produção com moeda fiat (multiplicador global)
            globalRules.global_K_boost *= Math.min(2.0, 1.0 + (1.0 / Math.max(1, ms.inflation)));
        }
    }
};
