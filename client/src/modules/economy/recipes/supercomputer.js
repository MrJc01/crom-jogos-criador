export default {
    id: 'supercomputer',
    type: 'recipe',
    name: 'Supercomputadores',
    desc: 'Conecta chips em massa para simular o mundo. Multiplica o ganho passivo de DNA.',
    inputs: { chips: 5, adaptationPoints: 100 },
    outputs: { computers: 1 },
    craftTimeTicks: 30, // 30 dias para montar
    requirements: ['industry_basic'],
    onComplete(engine) {
        if (engine.inventory.computers === 1 && engine.onEvent) {
            engine.onEvent("ERA DA INFORMAÇÃO: O primeiro Supercomputador foi montado! A geração passiva de DNA foi multiplicada.", "global");
        }
    }
};
