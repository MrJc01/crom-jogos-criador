/**
 * N22-24. TradeExpansion — Rotas, Moedas, Sanções.
 */
export default {
    id: 'trade_expansion',
    type: 'economy',
    applyTick(node, globalRules, engine) {
        if (!node.infected) return;
        if (engine.day % 30 !== 0) return;
        if (engine._tradeExpProcessed === engine.year + '_' + engine.day) return;
        engine._tradeExpProcessed = engine.year + '_' + engine.day;

        if (!engine.activeTradeRoutes) engine.activeTradeRoutes = [];
        if (!engine.currencies) engine.currencies = {};
        if (!engine.sanctions) engine.sanctions = [];

        // Trade routes: surplus → deficit
        if (engine.activeTradeRoutes.length < 20) {
            const surplus = [], deficit = [];
            engine.nodes.forEach(n => {
                if (!n.infected) return;
                if ((n.food||0) > n.demographics.total*3) surplus.push(n);
                if ((n.food||0) < n.demographics.total*0.5 && n.demographics.total>100) deficit.push(n);
            });
            if (surplus.length > 0 && deficit.length > 0) {
                const src = surplus[Math.floor(Math.random()*surplus.length)];
                const dst = deficit[Math.floor(Math.random()*deficit.length)];
                if ((src.transport?.level||0) > 0) {
                    engine.activeTradeRoutes.push({ sourceId:src.id, targetId:dst.id, good:'food', amount:Math.floor((src.food||0)*0.05), age:0 });
                }
            }
        }
        for (let i=engine.activeTradeRoutes.length-1; i>=0; i--) {
            const r = engine.activeTradeRoutes[i];
            const src = engine.nodes.get(r.sourceId), dst = engine.nodes.get(r.targetId);
            if (!src?.infected||!dst?.infected) { engine.activeTradeRoutes.splice(i,1); continue; }
            const t = Math.min(r.amount, src.food||0);
            if (t>0) { src.food -= t; dst.food = (dst.food||0) + Math.floor(t*0.9); }
            r.age++; if (r.age>12||Math.random()<0.02) engine.activeTradeRoutes.splice(i,1);
        }

        // Currencies
        if (engine.globalPop > 10000) {
            const facs = engine.globalDemographics?.factions || {};
            for (const [fId,ct] of Object.entries(facs)) {
                if (ct>10000 && !engine.currencies[fId]) {
                    const names = ['Dracma','Denário','Florim','Ducado','Cruzeiro','Marco'];
                    engine.currencies[fId] = { name: names[Math.floor(Math.random()*names.length)], value:1.0 };
                    engine.onEvent?.({ message:`💰 MOEDA cunhada: "${engine.currencies[fId].name}"`, type:'milestone', color:'#f1c40f' }, 'milestone');
                }
            }
        }

        // Sanctions
        if (engine.globalTrust < 25 && engine.sanctions.length === 0 && Math.random() < 0.01) {
            engine.sanctions.push({ type:'embargo', since:engine.year });
            engine.pressures.social += 0.5;
            engine.onEvent?.({ message:'🚫 EMBARGO COMERCIAL imposto! Comércio -50%.', type:'warning', color:'#e74c3c' }, 'warning');
        }
        for (let i=engine.sanctions.length-1; i>=0; i--) {
            if (engine.globalTrust > 60) {
                engine.sanctions.splice(i,1);
                engine.onEvent?.({ message:'✅ SANÇÕES LEVANTADAS.', type:'milestone', color:'#27ae60' }, 'milestone');
            }
        }
    }
};
