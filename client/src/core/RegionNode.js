import { Demographics } from './Demographics.js';

export class RegionNode {
    constructor(id, name, capacity, biome, resources, neighbors) {
        this.id = id;
        this.name = name;
        this.capacity = capacity;
        this.biome = biome;
        this.resources = resources;
        this.neighbors = neighbors;
        
        this.soil = 100.0; // Fertilidade inicial (%)
        this.infected = false;
        this.demographics = new Demographics(0);
    }
    
    infect(initialPop, sourceDemographics = null) {
        if (this.infected) return;
        this.infected = true;
        this.demographics = new Demographics(initialPop);
        if (sourceDemographics && sourceDemographics.dist) {
            // Copia a distribuição de facções e religiões originárias
            this.demographics.dist.factions = { ...sourceDemographics.dist.factions };
            this.demographics.dist.religion = { ...sourceDemographics.dist.religion };
        }
    }
}
