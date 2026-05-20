export default {
    id: 'genetics',
    type: 'biology',
    applyTick(node, globalRules, engine) {
        if (!node.demographics || node.demographics.total === 0) return;

        // Inicializar genes e espécies herdados ou padrão
        if (!node.genes) {
            let parentNode = null;
            if (node.neighbors) {
                for (const neighborId of node.neighbors) {
                    const neighbor = engine.nodes.get(neighborId);
                    if (neighbor && neighbor.genes) {
                        parentNode = neighbor;
                        break;
                    }
                }
            }
            if (parentNode) {
                node.genes = JSON.parse(JSON.stringify(parentNode.genes));
                node.species = JSON.parse(JSON.stringify(parentNode.species));
            } else {
                node.genes = {
                    coldResistance: 0.0,      // Faixa: 0.0 a 1.0 (resiste à Tundra/Gelo)
                    cognitiveBonus: 0.05,     // Faixa: 0.0 a 1.0 (buff de geração de DNA)
                    huntingEfficiency: 0.1,  // Faixa: 0.0 a 1.0 (buff de caça)
                    bipedalism: 0.1          // Faixa: 0.0 a 1.0 (buff de migração)
                };
                node.species = {
                    sapiens: 1.0,
                    neanderthal: 0.0,
                    denisova: 0.0,
                    erectus: 0.0
                };
            }
        }

        const deltaDays = globalRules.deltaDays || 1;
        const yearsPassed = deltaDays / 365;

        // 1. SELEÇÃO NATURAL POR PRESSÃO AMBIENTAL
        // Frio Extremo (Tundra ou Gelo) seleciona resistência ao frio
        if (node.biome && (node.biome.id === 'tundra' || node.biome.id === 'ice_sheet')) {
            const selectionPressure = 0.015 * yearsPassed; 
            node.genes.coldResistance = Math.min(1.0, node.genes.coldResistance + selectionPressure);
        }

        // Clima árido ou deserto seleciona eficiência de recursos
        if (node.biome && node.biome.id === 'desert') {
            const selectionPressure = 0.01 * yearsPassed;
            node.genes.huntingEfficiency = Math.min(1.0, node.genes.huntingEfficiency + selectionPressure);
        }

        // 2. MUTAÇÃO ESTOCÁSTICA ALEATÓRIA (Surgimento de novos traços)
        // A probabilidade de mutação benéfica escala de forma logarítmica com o tamanho da população
        const mutationRate = 0.00005 * Math.log10(Math.max(10, node.demographics.total)) * yearsPassed;
        
        if (Math.random() < mutationRate) {
            if (node.genes.cognitiveBonus < 1.0) {
                node.genes.cognitiveBonus = Math.min(1.0, node.genes.cognitiveBonus + 0.08);
                if (engine.onEvent && Math.random() < 0.05) {
                    engine.onEvent({
                        message: `🧬 MUTAÇÃO: Hominídeos em ${node.name} desenvolveram conexões sinápticas que ampliam a cognição.`,
                        nodeId: node.id, type: 'biology', color: '#00ffcc'
                    }, 'biology');
                }
            }
        }

        if (Math.random() < mutationRate) {
            if (node.genes.bipedalism < 1.0) {
                node.genes.bipedalism = Math.min(1.0, node.genes.bipedalism + 0.1);
            }
        }

        // 3. EFEITO DOS BUFFS GENÉTICOS NO MOTOR
        // Redução de mortes por frio em biomas frios baseado no gene coldResistance
        if (node.biome && (node.biome.id === 'tundra' || node.biome.id === 'ice_sheet')) {
            const coldProtection = node.genes.coldResistance; // 0 a 1
            // Se coldResistance = 1.0, neutraliza 90% das mortes climáticas locais
            node.coldSurvivalModifier = 1.0 - (coldProtection * 0.9);
        } else {
            node.coldSurvivalModifier = 1.0;
        }

        // 4. CONTRIBUIÇÃO DE DNA ADAPTADA À COGNIÇÃO
        if (node.genes.cognitiveBonus > 0) {
            // Aceleração da acumulação de pontos de DNA evolutivo
            const baseDnaGain = (node.demographics.total * node.genes.cognitiveBonus * 0.0002) * yearsPassed;
            engine.adaptationPoints = (engine.adaptationPoints || 0) + baseDnaGain;
        }
    }
};
