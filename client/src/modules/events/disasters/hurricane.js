export default {
    id: 'hurricane',
    type: 'event',
    name: 'Super Furacão',
    triggerCondition(engine) {
        // Dispara se a severidade passar de 50 e com leve chance por tick
        return engine.severity > 50 && Math.random() < 0.005;
    },
    applyEvent(engine) {
        // Escolhe um país populoso aleatório
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected && n.demographics.total > 1000);
        if (infectedNodes.length === 0) return null;
        
        const target = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
        
        // Furacão devasta 10% da população local
        const deaths = Math.floor(target.demographics.total * 0.10);
        target.demographics.kill(deaths);
        
        return `O Anticorpo Planetário disparou um Super Furacão em ${target.name}, ceifando ${deaths} vidas.`;
    }
};
