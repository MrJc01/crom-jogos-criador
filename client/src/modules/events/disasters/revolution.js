/** N31. Revolution — Revolução popular derruba governo. */
export default { id:'revolution', type:'event',
    triggerProbability(e) {
        let avgMorale=0,ct=0; e.nodes.forEach(n=>{ if(n.infected&&n.morale!==undefined){avgMorale+=n.morale;ct++;} });
        avgMorale = ct>0 ? avgMorale/ct : 50;
        return avgMorale<20 && (e.literacy||5)>30 ? 0.01 : 0;
    },
    applyEvent(e) {
        const killed = Math.floor(e.globalPop*0.05);
        e.nodes.forEach(n=>{ if(n.infected) n.demographics.kill(Math.floor(n.demographics.total*0.05)); });
        e.pressures.social = Math.max(0,e.pressures.social-2);
        if(e.currentGovernment) e.currentGovernment.type = 'autocracy';
        e.logEvent?.({message:'🔥 Revolução Popular'},'disaster');
        return {message:`🔥 REVOLUÇÃO: O povo derrubou o governo! ${killed} mortos. Novo regime emerge.`,type:'nemesis',color:'#c0392b'};
    }
};
