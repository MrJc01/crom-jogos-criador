export default {
    id: 'industry_basic',
    type: 'technology',
    root: 'technological',
    name: 'Revolução Industrial',
    desc: 'Lança as bases da manufatura de chips e recursos avançados. Causa impacto ambiental.',
    baseCost: 5000,
    requires: ["metalurgia_bronze","educacao_universal"],
    modifiers: {
        global_r_boost: 1.2,
        severity_flat_increase: 10 // Aumenta a severidade base do planeta
    }
};
