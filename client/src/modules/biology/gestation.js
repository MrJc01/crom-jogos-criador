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
        let K = Math.floor(node.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
        const P = demo.total;
        
        // --- DEGRADAÇÃO DO SOLO (Tarefa 21) ---
        // Se a população estiver acima de 90% da capacidade de carga, o solo começa a morrer
        if (P > K * 0.9) {
            node.soil -= 0.005; // Perde 0.5% ao ano aproximadamente
            if (node.soil < 0) node.soil = 0;
        } else if (P < K * 0.5 && node.soil < 100) {
            // Se a área for abandonada/pouco habitada, a natureza se recupera
            node.soil += 0.001; 
            if (node.soil > 100) node.soil = 100;
        }

        // A capacidade K é multiplicada pela fertilidade do solo (0 a 1)
        K = Math.floor(K * (Math.max(10, node.soil) / 100)); // Mínimo de 10% para nunca zerar totalmente

        // Fator logístico de espaço (reprodução cessa se lotado)
        let spaceFactor = 1 - (P / K);
        if (spaceFactor < 0) {
            spaceFactor = 0;
            // FOME: Se passar da capacidade, mata um pouco da população
            demo.kill(Math.floor(P * 0.001)); 
        }
        
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
