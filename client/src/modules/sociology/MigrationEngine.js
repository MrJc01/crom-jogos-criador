import { FactionsData } from '../../core/FactionsData.js';

export default {
    id: 'sociology_migration_drive',
    name: 'Vontade de Explorar e Migração',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        // Migrações ocorrem no final do mês para economizar processamento
        if (engine.day % 30 !== 0) return;
        
        // Se a região tem vizinhos
        if (node.neighbors.length === 0) return;

        const capacityRatio = node.demographics.total / node.capacity;
        
        // Pega as facções dominantes no nó
        for (const [facId, pct] of Object.entries(node.demographics.dist.factions)) {
            const data = FactionsData.getFaction(facId);
            const drive = data.explorationDrive || 0.01;
            
            // Fator de pressão: Se o nó está cheio, o drive aumenta exponencialmente
            // Se o nó tem folga, depende unicamente da curiosidade nativa (explorationDrive)
            const pressure = capacityRatio > 0.8 ? (capacityRatio - 0.8) * 5 : 0;
            const effectiveDrive = Math.min(1.0, drive + pressure);
            
            // A taxa de pessoas que decide migrar (Média de 0.1% a 2% da facção por mês)
            const migrationRate = effectiveDrive * 0.02;
            const migrants = Math.floor(node.demographics.total * pct * migrationRate);
            
            if (migrants > 10) {
                // Sorteia um vizinho para invadir/colonizar
                const targetId = node.neighbors[Math.floor(Math.random() * node.neighbors.length)];
                const targetNode = engine.nodes.get(targetId);
                
                if (targetNode) {
                    // Remove do nó atual
                    node.demographics.kill(migrants);
                    
                    // Adiciona no nó alvo
                    if (!targetNode.infected) targetNode.infect(0);
                    targetNode.demographics.addBirths(migrants); // Usamos addBirths como proxy genérico para adicionar massa demográfica
                    
                    // Adiciona a facção na distribuição do alvo
                    if (!targetNode.demographics.dist.factions[facId]) {
                        targetNode.demographics.dist.factions[facId] = 0;
                    }
                    
                    // Ajuste da pizza (se entrou M pessoas num local com T pessoas)
                    const newTotal = targetNode.demographics.total;
                    for (const f in targetNode.demographics.dist.factions) {
                        if (f === facId) {
                            // Antigos da mesma facção + Novos
                            targetNode.demographics.dist.factions[f] = ((targetNode.demographics.dist.factions[f] * (newTotal - migrants)) + migrants) / newTotal;
                        } else {
                            // Dilui os outros
                            targetNode.demographics.dist.factions[f] = (targetNode.demographics.dist.factions[f] * (newTotal - migrants)) / newTotal;
                        }
                    }
                }
            }
        }
    }
};
