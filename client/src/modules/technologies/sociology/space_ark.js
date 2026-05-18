export default {
    id: 'space_ark',
    type: 'technology',
    root: 'sociology',
    name: 'Arca Geracional',
    desc: 'O pináculo da fuga humana. Zera a população terrestre para salvar a espécie entre as estrelas.',
    baseCost: 800000,
    requires: ["space_dyson","hibernacao_criogenica"],
    modifiers: {},
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '🚀🌟 VITÓRIA: A Arca Geracional foi lançada! A Terra foi abandonada para que a humanidade viva entre as estrelas. Fim da Simulação Terrestre.', color: '#ffffff'}, 'cosmic');
        }
        
        // Zera a população mundial
        engine.nodes.forEach(node => {
            if (node.infected) {
                node.demographics.kill(node.demographics.total);
            }
        });
        
        // Trigger de Vitória / Transição (Pode ser lido pelo frontend para dar Game Over Win)
        engine.gameWon = true; 
    }
};
