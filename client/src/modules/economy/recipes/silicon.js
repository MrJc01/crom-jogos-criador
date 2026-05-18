export default {
    id: 'silicon',
    type: 'recipe',
    name: 'Refino de Silício',
    desc: 'Purifica minerais brutos em silício utilizável.',
    inputs: { minerals: 100 },
    outputs: { silicon: 1 },
    craftTimeTicks: 1, // 1 dia
    requirements: ['industry_basic']
};
