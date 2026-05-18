/** N34. Genetics — Diversidade genética e endogamia.
 *  N35. Nutrition — Nutrição e deficiências alimentares.
 *  N36. Ecology — Ecossistema e biodiversidade.
 */
export default {
    id: 'bio_expansion',
    type: 'biology',
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 90 !== 0) return;

        const pop = node.demographics.total;
        if (!node.bio) node.bio = { genetics: 50, nutrition: 50, biodiversity: 100 };

        // N34: GENETICS
        // Pop isolado (nenhum vizinho infectado) = endogamia
        const infNeighbors = (node.neighbors||[]).filter(nId => engine.nodes.get(nId)?.infected).length;
        if (infNeighbors === 0 && pop > 500) {
            node.bio.genetics = Math.max(10, node.bio.genetics - 0.5); // Endogamia
        } else {
            node.bio.genetics = Math.min(100, node.bio.genetics + infNeighbors * 0.1);
        }
        // Genetics baixo = +disease vulnerability
        if (node.bio.genetics < 30) {
            node.diseaseVulnerability = 1.5;
        } else {
            node.diseaseVulnerability = 1.0;
        }

        // N35: NUTRITION
        const hasMeat = Object.values(node.herds||{}).some(c => c > 0);
        const hasCrops = (node.crops||[]).length > 0;
        const hasFish = (node.fishStock||0) > 30;
        let variety = 0;
        if (hasMeat) variety++;
        if (hasCrops) variety++;
        if (hasFish) variety++;
        if ((node.crops||[]).length >= 3) variety++;

        node.bio.nutrition = Math.min(100, 30 + variety * 15 + ((node.food||0)>0 ? 10 : -20));

        // Nutrition effects
        if (node.bio.nutrition < 30) {
            // Deficiências: escorbuto, anemia
            if (Math.random() < 0.005) {
                const deaths = Math.floor(pop * 0.001);
                node.demographics.kill(deaths);
            }
            if (!node.moraleFactors) node.moraleFactors = {};
            node.moraleFactors.nutrition = -5;
        } else if (node.bio.nutrition > 70) {
            if (!node.moraleFactors) node.moraleFactors = {};
            node.moraleFactors.nutrition = 3;
        }

        // N36: ECOLOGY / BIODIVERSITY
        // Desmatamento destrói biodiversidade
        const deforestation = (node.resources?.wood||0) < 3000 && node.biome?.id === 'jungle';
        if (deforestation) {
            node.bio.biodiversity = Math.max(0, node.bio.biodiversity - 1);
        }
        // Poluição destrói
        if ((engine.globalTemperatureOffset||0) > 2) {
            node.bio.biodiversity = Math.max(0, node.bio.biodiversity - 0.5);
        }
        // Recovery natural (lento)
        if (node.bio.biodiversity < 80 && !deforestation) {
            node.bio.biodiversity = Math.min(100, node.bio.biodiversity + 0.1);
        }

        // Biodiversity afeta estabilidade do hex
        if (node.bio.biodiversity < 20) {
            // Erosão acelerada
            node.soil = Math.max(0, (node.soil||50) - 0.1);
            if (node.bio.biodiversity <= 0 && engine.onEvent && !node._extinctionWarned) {
                node._extinctionWarned = true;
                engine.onEvent({
                    message: `🦕 EXTINÇÃO EM MASSA: Biodiversidade colapsou em ${node.name}. Solo degrada sem remédio.`,
                    nodeId: node.id, type: 'nemesis', color: '#2c3e50'
                }, 'nemesis');
            }
        }
    }
};
