export default {
    id: 'hibernacao_criogenica',
    type: 'technology',
    root: 'biological',
    name: 'Hibernação Criogênica',
    desc: 'Necessário para expansão extra-planetária (Arca Geracional).',
    baseCost: 120000,
    requires: ["clonagem_orgaos"],
    modifiers: {
        // Apenas desbloqueia o requisito para crafting espacial
    }
};
