export default {
    id: 'gestation',
    type: 'biology',
    applyTick(node, globalRules, engine) {
        if (node.demographics.total === 0) return;

        const demo = node.demographics;
        
        // 1. NASCIMENTO (Tira do dia 0 e adiciona à demografia)
        const newborns = demo.pregnancyQueue.shift();
        if (newborns > 0) {
            demo.addBirths(newborns);
        }
        
        // 2. CONCEPÇÃO (Baseado em Fêmeas Adultas disponíveis)
        const fertileFemales = demo.total * demo.dist.sex.F * demo.dist.age.adult;
        
        // O limite de capacidade real do bioma no dia de hoje
        const K = Math.floor(node.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
        const P = demo.total;
        
        // Fator logístico de espaço (reprodução cessa se lotado)
        let spaceFactor = 1 - (P / K);
        if (spaceFactor < 0) spaceFactor = 0;
        
        const r = globalRules.base_r * globalRules.global_r_boost;
        
        // Número de novas gravidezes no tick
        let newPregnancies = Math.floor(fertileFemales * r * spaceFactor);
        
        // Garantia de centelha vital se o país for muito novo
        if (newPregnancies < 1 && P < K && fertileFemales > 2 && Math.random() < 0.5) {
            newPregnancies = 1;
        }
        
        // 3. ENFILEIRAMENTO (Vai para o fim da fila, nasce em ~270 dias)
        demo.pregnancyQueue.push(newPregnancies);
    }
};
