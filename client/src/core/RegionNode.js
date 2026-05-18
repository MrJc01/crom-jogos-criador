import { Demographics } from './Demographics.js';

export class RegionNode {
    constructor(id, name, capacity, biome, resources, neighbors) {
        this.id = id;
        this.name = name;
        this.capacity = capacity;
        this.biome = biome;
        this.resources = resources;
        this.neighbors = neighbors;
        
        this.infected = false;
        this.demographics = new Demographics(0);
    }
    
    infect(initialPop) {
        if (this.infected) return;
        this.infected = true;
        this.demographics = new Demographics(initialPop);
    }
}
