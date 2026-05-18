export default {
    id: 'mining',
    type: 'economy',
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        if (node.resources.minerals > 0) {
            // A força de trabalho é focada nos adultos
            const workers = Math.floor(node.demographics.total * node.demographics.dist.age.adult);
            
            // Extrai 1 mineral a cada 10k trabalhadores por dia
            let extract = Math.floor(workers / 10000);
            
            // Países pequenos mineram devagar
            if (extract < 1 && Math.random() < 0.1) extract = 1; 
            
            if (extract > node.resources.minerals) extract = node.resources.minerals;
            
            node.resources.minerals -= extract;
            engine.inventory.minerals += extract;
        }
    }
};
