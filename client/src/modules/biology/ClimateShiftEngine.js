/**
 * ClimateShiftEngine — Motor Dinâmico de Mudanças Climáticas.
 * 
 * Simula ciclos de Milankovitch (Eras do Gelo e Aquecimento Global).
 * Altera biomas com base na temperatura global e latitude do hexágono,
 * forçando as populações a perderem sua adaptação nativa e enfrentarem
 * o letal "Choque de Bioma".
 */
export default {
    id: 'biology_climate_shift',
    type: 'biology',
    
    applyTick(node, globalRules, engine) {
        // Mudanças climáticas são lentas, checamos a cada ano (dia 0 do ano novo)
        if (engine.day !== 0 || !node.infected) return;
        
        // Ciclo climático global (oscila entre -1.0 e 1.0)
        // Um ciclo completo de 10.000 anos = Math.PI * 2 na função (com divisor 5000)
        const climateCycleLength = 5000;
        const globalTemp = Math.sin((engine.year / climateCycleLength) * Math.PI);
        
        // Salva temperatura no engine para a UI poder consultar
        engine.globalTemperature = globalTemp;
        
        const oldBiome = node.biome?.id;
        let newBiome = oldBiome;
        let eventMsg = null;
        
        // Latitude do nó afeta susceptibilidade (0 = equador, 90 = polo)
        // Aqui assumimos que node.lat existe, senão interpolamos a linha (row)
        const lat = node.lat !== undefined ? Math.abs(node.lat) : (node.row ? Math.abs(node.row * 10) : 45);
        
        // ==========================================
        // 1. AQUECIMENTO GLOBAL (Desertificação)
        // ==========================================
        if (globalTemp > 0.8) {
            if (oldBiome === 'plains' && lat < 40 && Math.random() < 0.05) {
                newBiome = 'desert';
                eventMsg = 'A Grande Seca desertificou as planícies!';
            } else if (oldBiome === 'tundra' && lat < 70 && Math.random() < 0.05) {
                newBiome = 'plains';
                eventMsg = 'O gelo derreteu, revelando novas planícies.';
            } else if (oldBiome === 'jungle' && lat < 20 && Math.random() < 0.01) {
                newBiome = 'desert'; // Selvas são mais resistentes, mas podem secar
                eventMsg = 'O calor extremo calcinou as selvas úmidas.';
            }
        }
        
        // ==========================================
        // 2. ERA DO GELO (Glaciação)
        // ==========================================
        else if (globalTemp < -0.8) {
            if (oldBiome === 'plains' && lat > 50 && Math.random() < 0.05) {
                newBiome = 'tundra';
                eventMsg = 'A Era do Gelo congelou as planícies do norte!';
            } else if (oldBiome === 'desert' && Math.random() < 0.05) {
                newBiome = 'plains';
                eventMsg = 'As chuvas da era glacial tornaram o deserto fértil novamente.';
            } else if (oldBiome === 'jungle' && lat > 30 && Math.random() < 0.02) {
                newBiome = 'plains'; // Frio mata a selva
                eventMsg = 'O resfriamento global destruiu a floresta densa.';
            }
        }
        
        // Aplica a mudança
        if (newBiome !== oldBiome) {
            node.biome = { id: newBiome }; // Engine assume que tem id
            
            // Log histórico para a humanidade que estava ali
            if (node.demographics.total > 0 && engine.onEvent) {
                engine.onEvent({
                    message: `🌍 MUDANÇA CLIMÁTICA: Em ${node.name}, ${eventMsg} As populações sofrem choque ambiental repentino!`,
                    nodeId: node.id,
                    type: globalTemp > 0.8 ? 'disaster' : 'warning',
                    color: globalTemp > 0.8 ? '#d35400' : '#3498db'
                }, 'disaster');
                engine.logEvent?.({ message: `Clima alterou ${node.name} para ${newBiome}` }, 'disaster');
            }
        }
    }
};
