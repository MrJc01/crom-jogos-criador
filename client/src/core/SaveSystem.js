/**
 * client/src/core/SaveSystem.js
 * 
 * Sistema de Save e Load (Serialização/Desserialização) para o CROM.
 * Permite capturar o estado completo do GameEngine e de todas as RegionNodes,
 * gravando-o em um JSON editável, ou carregando-o para prosseguir simulações históricas.
 */

import { RegionNode } from './RegionNode.js';
import { Config } from '../config/ConfigLoader.js';

export class SaveSystem {
    /**
     * Serializa o estado completo do GameEngine para um objeto JSON estruturado.
     */
    static save(engine) {
        const nodesData = [];
        engine.nodes.forEach(node => {
            nodesData.push({
                id: node.id,
                name: node.name,
                infected: node.infected,
                capacity: node.capacity,
                food: Math.floor(node.food || 0),
                morale: node.morale || 50,
                wildGame: Math.floor(node.wildGame || 0),
                famineDays: node.famineDays || 0,
                biomeId: node.biome?.id || 'plains',
                biomeAdaptation: node.biomeAdaptation ? { ...node.biomeAdaptation } : null,
                soil: node.soil !== undefined ? parseFloat(node.soil.toFixed(2)) : 100,
                irrigationBoost: node.irrigationBoost || 1.0,
                waterConservation: node.waterConservation || 1.0,
                resources: {
                    wood: Math.floor(node.resources?.wood || 0),
                    water: Math.floor(node.resources?.water || 0),
                    minerals: Math.floor(node.resources?.minerals || 0)
                },
                demographics: {
                    total: Math.floor(node.demographics.total || 0),
                    dist: {
                        sex: { ...node.demographics.dist.sex },
                        age: { ...node.demographics.dist.age },
                        religion: { ...node.demographics.dist.religion },
                        factions: { ...node.demographics.dist.factions }
                    },
                    pregnancyQueue: [...node.demographics.pregnancyQueue]
                }
            });
        });

        return {
            saveVersion: "1.0.0",
            timestamp: new Date().toISOString(),
            year: engine.year,
            day: engine.day,
            globalPop: Math.floor(engine.globalPop),
            adaptationPoints: Math.floor(engine.adaptationPoints),
            severity: Math.floor(engine.severity),
            globalTrust: Math.floor(engine.globalTrust),
            globalKPenalty: parseFloat(engine.globalKPenalty.toFixed(4)),
            inventory: { ...engine.inventory },
            unlockedTechs: Array.from(engine.unlockedTechs),
            nodes: nodesData
        };
    }

    /**
     * Desserializa um estado JSON gravado, injetando-o de volta na instância do GameEngine.
     */
    static load(saveData, engine) {
        engine.year = saveData.year !== undefined ? saveData.year : 1;
        engine.day = saveData.day !== undefined ? saveData.day : 0;
        engine.globalPop = saveData.globalPop !== undefined ? saveData.globalPop : 0;
        engine.adaptationPoints = saveData.adaptationPoints !== undefined ? saveData.adaptationPoints : 0;
        engine.severity = saveData.severity !== undefined ? saveData.severity : 0;
        engine.globalTrust = saveData.globalTrust !== undefined ? saveData.globalTrust : 100;
        engine.globalKPenalty = saveData.globalKPenalty !== undefined ? saveData.globalKPenalty : 1.0;
        engine.inventory = { ...saveData.inventory };
        
        // Reconstrói a Tech Tree
        engine.techTree.unlocked = new Set(saveData.unlockedTechs || []);
        
        // Reconstrói os Nós do Mapa
        engine.nodes.clear();
        
        const biomesCfg = Config.get('biomes') || {};
        
        saveData.nodes.forEach(nData => {
            const biome = biomesCfg[nData.biomeId.toUpperCase()] || { id: nData.biomeId, capacityBase: 100000 };
            
            const node = new RegionNode(
                nData.id, 
                nData.name, 
                nData.capacity, 
                biome, 
                { ...nData.resources },
                [] // Vizinhos serão restabelecidos pelo mapa
            );
            
            node.infected = nData.infected;
            node.food = nData.food;
            node.morale = nData.morale;
            node.wildGame = nData.wildGame;
            node.famineDays = nData.famineDays;
            node.soil = nData.soil;
            node.irrigationBoost = nData.irrigationBoost || 1.0;
            node.waterConservation = nData.waterConservation || 1.0;
            
            if (nData.biomeAdaptation) {
                node.biomeAdaptation = { ...nData.biomeAdaptation };
            }
            
            // Demografia
            node.demographics.total = nData.demographics.total;
            node.demographics.dist = {
                sex: { ...nData.demographics.dist.sex },
                age: { ...nData.demographics.dist.age },
                religion: { ...nData.demographics.dist.religion },
                factions: { ...nData.demographics.dist.factions }
            };
            node.demographics.pregnancyQueue = [...nData.demographics.pregnancyQueue];
            
            engine.nodes.set(nData.id, node);
        });
        
        // Restabelece vizinhanças baseadas na configuração geográfica global do CROM
        engine.nodes.forEach((node, id) => {
            const idx = parseInt(id.replace('hex_', ''));
            const neighbors = [];
            if (idx > 0 && engine.nodes.has(`hex_${idx - 1}`)) neighbors.push(`hex_${idx - 1}`);
            if (idx < saveData.nodes.length - 1 && engine.nodes.has(`hex_${idx + 1}`)) neighbors.push(`hex_${idx + 1}`);
            if (idx >= 5 && engine.nodes.has(`hex_${idx - 5}`)) neighbors.push(`hex_${idx - 5}`);
            if (idx < saveData.nodes.length - 5 && engine.nodes.has(`hex_${idx + 5}`)) neighbors.push(`hex_${idx + 5}`);
            node.neighbors = neighbors;
        });

        return true;
    }
}
