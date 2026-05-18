export default {
    id: 'ww3',
    type: 'event',
    name: '3ª Guerra Mundial',
    triggerProbability(engine) {
        let prob = 0;
        
        // Só ocorre a partir da Era da Informação
        if (engine.currentEra.mult < 1000) return 0;
        
        // Severidade (escassez global) aumenta a chance
        if (engine.severity > 70) prob += 0.0001;
        if (engine.severity > 90) prob += 0.0005;
        
        // Fatores de Facção
        const militarists = engine.globalDemographics?.factions?.['expansionistas_militares'] || 0;
        const corporatists = engine.globalDemographics?.factions?.['corporatist'] || 0;
        
        const pop = engine.globalPop || 1;
        const ratio = (militarists + corporatists) / pop;
        
        // Se militaristas dominarem o globo, a chance de holocausto nuclear decola
        if (ratio > 0.3) prob += 0.001; 
        if (ratio > 0.5) prob += 0.005; // 0.5% ao dia é praticamente certo que ocorrerá em poucos meses
        
        return prob;
    },
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        let totalDeaths = 0;
        infectedNodes.forEach(target => {
            // Cada nação bombardeada perde de 30% a 70%
            const casualties = 0.3 + (Math.random() * 0.4);
            const deaths = Math.floor(target.demographics.total * casualties);
            target.demographics.kill(deaths);
            totalDeaths += deaths;
        });
        
        engine.adaptationPoints += 10000; // Muito DNA por estudo do desastre
        
        return `🚨 Holocausto Nuclear! A 3ª Guerra Mundial ceifou o assustador número de ${totalDeaths.toLocaleString('pt-BR')} vidas ao redor do globo.`;
    }
};
