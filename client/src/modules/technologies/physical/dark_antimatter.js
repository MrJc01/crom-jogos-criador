export default {
    id: 'dark_antimatter',
    type: 'technology',
    root: 'physical',
    name: 'Bomba de Antimatéria',
    desc: 'O armamento supremo. Aumenta absurdamente a severidade do planeta e dizima as populações locais brutalmente.',
    baseCost: 400000,
    requires: ["fusao_nuclear"],
    modifiers: {
        severity_flat_increase: 100
    },
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '💀 DARK TECH: O código de lançamento da Bomba de Antimatéria foi quebrado. O apocalipse está a um botão de distância.', color: '#ff0000'}, 'milestone');
        }
    }
};
