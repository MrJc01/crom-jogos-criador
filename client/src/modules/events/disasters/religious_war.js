/** N30. Religious War — Guerra religiosa entre facções. */
export default { id:'religious_war', type:'event',
    triggerProbability(e) {
        if(e.day%180!==0) return 0;
        let relCount=0; e.nodes.forEach(n=>{ if(n.religion?.active) relCount++; });
        return relCount>5 && e.globalTrust<40 ? 0.02 : 0;
    },
    applyEvent(e) {
        e.pressures.social += 3; e.globalTrust = Math.max(5,e.globalTrust-30);
        e.nodes.forEach(n=>{ if(n.infected&&n.religion?.active) { n.demographics.kill(Math.floor(n.demographics.total*0.08)); if(n.religion.temples>0) n.religion.temples--; }});
        e.logEvent?.({message:'⚔️ Guerra Religiosa'},'disaster');
        return {message:'⚔️ GUERRA RELIGIOSA: Cruzada/Jihad eclodiu! Templos destruídos. 8% da pop morta.',type:'nemesis',color:'#8e44ad'};
    }
};
