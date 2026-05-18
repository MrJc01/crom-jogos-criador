/** N32. Great Depression — Crash econômico global. */
export default { id:'great_depression', type:'event',
    triggerProbability(e) { return e.day%365===0 && (e.market?.inflation||1)>3 ? 0.05 : 0; },
    applyEvent(e) {
        if(e.market) { e.market.gdp = Math.floor(e.market.gdp*0.5); e.market.inflation=2; e.market.moneySupply=Math.floor(e.market.moneySupply*0.3); }
        e.globalTrust = Math.max(5,e.globalTrust-25);
        e.pressures.social += 2;
        e.logEvent?.({message:'📉 Grande Depressão'},'disaster');
        return {message:'📉 GRANDE DEPRESSÃO: GDP caiu 50%! Desemprego massivo. Trust -25.',type:'disaster',color:'#2c3e50'};
    }
};
