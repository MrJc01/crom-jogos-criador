export default {
    id: 'dark_eugenics',
    type: 'technology',
    root: 'sociology',
    name: 'Eugenia Algorítmica',
    desc: 'Um sistema brutal de purga automatizada. Elimina violentamente qualquer subcultura ou minoria disidente para manter uma coesão forçada.',
    baseCost: 350000,
    requires: ["dark_antimatter","cyberpunk_upload"],
    modifiers: {
        global_K_boost: 0.5, // Mata metade da capacidade global
        severity_flat_increase: 50
    },
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '💀 DARK TECH: A Eugenia Algorítmica foi implementada. Drones agora exterminam qualquer desvio genético do padrão.', color: '#ff0000'}, 'milestone');
        }
    }
};
