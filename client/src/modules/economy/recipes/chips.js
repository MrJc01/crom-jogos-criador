export default {
    id: 'chips',
    type: 'recipe',
    name: 'Microchips',
    desc: 'Funde silício em processadores básicos.',
    inputs: { silicon: 10, adaptationPoints: 20 },
    outputs: { chips: 1 },
    craftTimeTicks: 5, // 5 dias
    requirements: ['industry_basic']
};
