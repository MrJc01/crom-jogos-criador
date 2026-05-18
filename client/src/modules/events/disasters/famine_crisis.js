/** N29. Famine Crisis — Crise de fome global. */
export default { id:'famine_crisis', type:'event',
    triggerProbability(e) { return e.day%90===0 && (e._foodDeficit||0)>0.5 ? 0.03 : 0; },
    applyEvent(e) {
        e.pressures.social += 2; e.globalTrust = Math.max(5,e.globalTrust-20);
        e.nodes.forEach(n=>{ if(n.infected&&(n.food||0)<=0) n.demographics.kill(Math.floor(n.demographics.total*0.05)); });
        e.logEvent?.({message:'🍞 Crise de Fome Global'},'disaster');
        return {message:'🍞 CRISE DE FOME GLOBAL: Milhões morrem de fome. Guerras por comida eclodem.',type:'disaster',color:'#8b0000'};
    }
};
