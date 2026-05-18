/**
 * N27. EspionageEngine — Espionagem entre facções.
 * N28. PropagandaEngine — Propaganda e controle de narrativa.
 */
export default {
    id: 'espionage_propaganda',
    type: 'sociology',
    applyTick(node, globalRules, engine) {
        if (!node.infected) return;
        if (engine.day % 90 !== 0) return; // Trimestral
        if (engine._spyProcessed === engine.year + '_' + engine.day) return;
        engine._spyProcessed = engine.year + '_' + engine.day;

        if (!engine.spyNetworks) engine.spyNetworks = {};
        const techs = engine.unlockedTechs?.size || 0;
        if (techs < 10) return; // Espionagem requer era avançada

        // Spy operations
        const facs = Object.keys(engine.globalDemographics?.factions || {});
        if (facs.length >= 2) {
            const spy = facs[Math.floor(Math.random()*facs.length)];
            const target = facs.filter(f => f !== spy)[Math.floor(Math.random()*(facs.length-1))];
            if (!engine.spyNetworks[spy]) engine.spyNetworks[spy] = { infiltration: 0 };

            // Build network
            engine.spyNetworks[spy].infiltration = Math.min(100, engine.spyNetworks[spy].infiltration + 5);

            // Operations when infiltration > 30
            if (engine.spyNetworks[spy].infiltration > 30 && Math.random() < 0.05) {
                const ops = [
                    { name: 'Roubo de Tech', effect: () => { engine.adaptationPoints += 50; }, msg: '🕵️ Tecnologia roubada! +50 DNA.' },
                    { name: 'Sabotagem', effect: () => { engine.inventory.minerals = Math.max(0, engine.inventory.minerals - 50); }, msg: '💣 Sabotagem! -50 minerais.' },
                    { name: 'Incitar Revolta', effect: () => { engine.pressures.social += 0.5; }, msg: '📢 Revolta incitada! Pressão social +0.5.' },
                    { name: 'Intel', effect: () => { engine.spyNetworks[spy].infiltration += 10; }, msg: '📋 Intel coletada! Infiltração +10.' }
                ];
                const op = ops[Math.floor(Math.random()*ops.length)];
                op.effect();
                engine.onEvent?.({ message: `🕵️ ESPIONAGEM (${spy}): ${op.msg}`, type:'warning', color:'#2c3e50' }, 'warning');
            }
        }

        // N28: Propaganda
        if (engine.commLevel >= 5) { // Rádio+
            // Propaganda boost morale mas drena trust
            engine.nodes.forEach(n => {
                if (!n.infected) return;
                if (!n.moraleFactors) n.moraleFactors = {};
                if (engine.currentGovernment?.type === 'autocracy') {
                    n.moraleFactors.propaganda = 10;
                    engine.globalTrust = Math.max(5, engine.globalTrust - 0.01);
                }
            });
        }
    }
};
