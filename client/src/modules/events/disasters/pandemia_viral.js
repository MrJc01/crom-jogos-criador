export default {
    id: 'pandemia_viral',
    type: 'event',
    name: 'Pandemia Viral',
    triggerCondition(engine) { return engine.severity >= 70 && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) Pandemia Viral!'; }
};