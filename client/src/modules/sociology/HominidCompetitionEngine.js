export default {
    id: 'hominid_competition',
    type: 'sociology',
    applyTick(node, globalRules, engine) {
        if (!node.demographics || node.demographics.total === 0) return;

        // Inicializar espécies se não existirem
        if (!node.species) {
            node.species = {
                sapiens: 1.0,      // Inicia em 100% Sapiens na África
                neanderthal: 0.0,  // Neanderitais na Europa
                denisova: 0.0,     // Denisovanos na Ásia
                erectus: 0.0       // Erectus antigos
            };
        }

        // Configuração geográfica inicial ao colonizar uma nova província
        if (node.demographics.total > 0 && node.species.sapiens === 1.0 && node.species.neanderthal === 0.0 && node.species.denisova === 0.0) {
            if (node.name === 'Germânia' || node.name === 'Britânia' || node.name === 'Roma') {
                // Europa é terra Neandertal
                node.species.neanderthal = 0.95;
                node.species.sapiens = 0.05;
            } else if (node.name === 'Vale do Indus' || node.name === 'Yangtze') {
                // Ásia tem Denisovanos e Erectus remanescentes
                node.species.denisova = 0.60;
                node.species.erectus = 0.30;
                node.species.sapiens = 0.10;
            }
        }

        const deltaDays = globalRules.deltaDays || 1;
        const yearsPassed = deltaDays / 365;

        // 1. APTIDÕES COMPETITIVAS (SELEÇÃO NATURAL DARWINIANA)
        // Sapiens ganha aptidão por avanço cultural (número de techs paleolíticas)
        const techCount = engine.unlockedTechs ? engine.unlockedTechs.size : 0;
        const sapiensApt = 1.0 + (techCount * 0.12);
        
        // Neanderitais são fortes e adaptados ao frio
        const neanderApt = 1.2 + (node.genes?.coldResistance || 0.0) * 0.5;
        const denisovaApt = 1.05;
        const erectusApt = 0.70;

        // Populações absolutas atuais
        const total = node.demographics.total;
        let sapiensPop = total * node.species.sapiens;
        let neanderPop = total * node.species.neanderthal;
        let denisovaPop = total * node.species.denisova;
        let erectusPop = total * node.species.erectus;

        // Pressão de Seleção (Lotka-Volterra simplificado)
        if (neanderPop > 0 && sapiensPop > 0) {
            const pressure = (sapiensApt - neanderApt) * 0.015 * yearsPassed;
            if (pressure > 0) {
                const shift = Math.min(neanderPop, neanderPop * pressure);
                neanderPop -= shift;
                sapiensPop += shift;
            }
        }

        if (denisovaPop > 0 && sapiensPop > 0) {
            const pressure = (sapiensApt - denisovaApt) * 0.02 * yearsPassed;
            if (pressure > 0) {
                const shift = Math.min(denisovaPop, denisovaPop * pressure);
                denisovaPop -= shift;
                sapiensPop += shift;
            }
        }

        if (erectusPop > 0 && sapiensPop > 0) {
            const pressure = (sapiensApt - erectusApt) * 0.04 * yearsPassed;
            if (pressure > 0) {
                const shift = Math.min(erectusPop, erectusPop * pressure);
                erectusPop -= shift;
                sapiensPop += shift;
            }
        }

        // Hibridização Arqueológica (absorção genética na Eurásia)
        if (neanderPop > 0 && sapiensPop > 0) {
            const hybridRate = 0.002 * yearsPassed; // Fluxo gênico
            const hybrid = Math.min(neanderPop, neanderPop * hybridRate);
            neanderPop -= hybrid;
            sapiensPop += hybrid;
            
            // Incorpora traços de resistência ao frio neanderthal nos sapiens
            if (node.genes) {
                node.genes.coldResistance = Math.min(1.0, node.genes.coldResistance + 0.015 * yearsPassed);
            }
        }

        // Recalcular as novas proporções populacionais
        const newTotal = sapiensPop + neanderPop + denisovaPop + erectusPop;
        if (newTotal > 0) {
            node.species.sapiens = sapiensPop / newTotal;
            node.species.neanderthal = neanderPop / newTotal;
            node.species.denisova = denisovaPop / newTotal;
            node.species.erectus = erectusPop / newTotal;
        }
    }
};
