/** N33. Plague of Locusts — Praga de gafanhotos destrói crops. */
export default { id:'plague_locusts', type:'event',
    triggerProbability(e) { return e.day%90===0 ? 0.005 : 0; },
    applyEvent(e) {
        let hit=0;
        e.nodes.forEach(n=>{ if(n.infected && n.crops?.length>0 && n.biome?.id!=='tundra') {
            if(Math.random()<0.3) { n.food=Math.floor((n.food||0)*0.2); hit++; }
        }});
        if(hit===0) return null;
        e.logEvent?.({message:`🦗 Gafanhotos em ${hit} hexes`},'disaster');
        return {message:`🦗 PRAGA DE GAFANHOTOS: ${hit} regiões agrícolas devastadas! 80% das crops perdidas.`,type:'disaster',color:'#8b4513'};
    }
};
