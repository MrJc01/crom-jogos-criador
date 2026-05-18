import { FactionsData } from '../../core/FactionsData.js';

/**
 * EthnogenesisEngine — Etnogênese e Assimilação Cultural
 * 
 * Dinamiza as frações populacionais:
 * 1. Assimilação: Minorias (<10%) são lentamente absorvidas pela Maioria.
 * 2. Cisma (Separação): Maiorias famintas se quebram em facções rebeldes independentes.
 */
export default {
    id: 'sociology_ethnogenesis',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        // Mudanças culturais ocorrem geracionalmente (checamos uma vez ao ano)
        if (engine.day !== 0 || !node.infected) return;
        
        const factions = Object.keys(node.demographics.dist.factions);
        if (factions.length === 0) return;
        
        // 1. Encontra a Maioria Absoluta
        let majorityFac = null;
        let majorityPct = 0;
        
        for (const [fac, pct] of Object.entries(node.demographics.dist.factions)) {
            if (pct > majorityPct) {
                majorityPct = pct;
                majorityFac = fac;
            }
        }
        
        // ==========================================
        // ASSIMILAÇÃO CULTURAL
        // ==========================================
        if (majorityPct > 0.5) {
            for (const fac of factions) {
                const pct = node.demographics.dist.factions[fac];
                if (fac !== majorityFac && pct < 0.1) { // Minoria < 10%
                    // Absorve 1% do total (10% da minoria) por ano
                    const assimilationRate = pct * 0.1;
                    
                    if (pct - assimilationRate < 0.001) {
                        // Extinção da minoria naquele hex, totalmente assimilada
                        node.demographics.dist.factions[majorityFac] += pct;
                        delete node.demographics.dist.factions[fac];
                    } else {
                        node.demographics.dist.factions[majorityFac] += assimilationRate;
                        node.demographics.dist.factions[fac] -= assimilationRate;
                    }
                }
            }
        }
        
        // ==========================================
        // CISMA (SEPARAÇÃO REBELDE)
        // ==========================================
        // Na Idade da Pedra, tribos se fragmentam mais facilmente (menos cap max). Em impérios, exige mais povo.
        const minPopForSchism = engine.currentEra.mult === 1 ? 50 : 5000;
        
        // Se a pressão social for extrema ou houver fome crónica, e a facção for gigante (>80% do hex)
        if (engine.pressures.social > 5.0 || (node.food || 0) <= 0) {
            if (majorityPct > 0.8 && node.demographics.total > minPopForSchism) {
                // 1% de chance de cisma por ano nessas condições
                if (Math.random() < 0.01) {
                    const data = FactionsData.getFaction(majorityFac);
                    // O nome da nova facção (Filha da facção traumatizada)
                    const newFactionId = `${majorityFac}_rebeldes_${Math.floor(Math.random() * 1000)}`;
                    
                    // Tenta importar dicionário de nomes aleatórios (NamesConfig)
                    let newName = `Rebeldes ${data.name.split(' ')[0]}`;
                    try {
                        // Tenta ler o json para dar um flavor melhor (apenas front-end/Vite)
                        // Se não conseguir, usa o fallback genérico
                        const newPrefix = ["Exército", "Legião", "Irmandade"][Math.floor(Math.random() * 3)];
                        const newSuffix = ["Livre", "da Fome", "Verdadeiro"][Math.floor(Math.random() * 3)];
                        newName = `${newPrefix} ${newSuffix} de ${data.name.split(' ')[0]}`;
                    } catch(e) {}
                    
                    // Herda traits mas vira agressiva
                    const newTraits = [...data.traits.filter(t => t !== "pacifist"), "chaotic", "militarist"];
                    FactionsData.dynamicFactions[newFactionId] = {
                        name: newName,
                        baseColor: FactionsData.generateHashColor(newFactionId),
                        traits: newTraits,
                        traumas: [...(data.traumas || [])]
                    };
                    
                    // 20% da maioria quebra e vira rebelde
                    const splitPct = majorityPct * 0.2;
                    node.demographics.dist.factions[majorityFac] -= splitPct;
                    node.demographics.dist.factions[newFactionId] = splitPct;
                    
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `🔥 CISMA CULTURAL: Em ${node.name}, a fome e pressão dividiram a facção ${data.name}. Nasce a dissidência: ${newName}!`,
                            nodeId: node.id, type: 'warning', color: '#e74c3c'
                        }, 'sociology');
                    }
                }
            }
        }
    }
};
