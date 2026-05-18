export const Alignments = [
    { id: 'peaceful', name: 'Pacífico', traits: ['pacifist', 'spiritual'], colorBase: [120, 180] }, // Verde/Ciano
    { id: 'neutral', name: 'Neutro', traits: ['survivalist'], colorBase: [0, 360] },
    { id: 'aggressive', name: 'Agressivo', traits: ['militarist', 'expansionist'], colorBase: [0, 30] }, // Vermelhos/Laranjas
    { id: 'chaotic', name: 'Caótico Maligno', traits: ['militarist', 'mutant'], colorBase: [270, 300] }, // Roxos
    { id: 'symbiotic', name: 'Simbiótico', traits: ['ecological', 'pacifist'], colorBase: [90, 150] } // Verdes vivos
];

const PREFIXES = [
    "A", "Al", "An", "Ba", "Bo", "Crom", "Cy", "Dra", "El", "Eko", 
    "Fa", "Gla", "Gor", "Ha", "Huo", "Ig", "Kro", "Lor", "Lu", "Ma", 
    "Ne", "Nox", "Om", "Pele", "Qua", "Ra", "Ro", "Syl", "Ta", "Te", 
    "Um", "Val", "Vo", "Xy", "Za", "Zor"
];

const MIDDLES = [
    "", "ra", "la", "ma", "ni", "go", "thor", "xal", "vi", "ka", 
    "lo", "pe", "si", "tu", "ze", "ba", "da", "fe", "hi", "jo", 
    "ko", "lu", "mu", "nu", "po", "ru", "su", "vu", "wu", "xu", "yu", "zu",
    "bla", "cra", "dra", "fra", "gra", "pra", "tra", "vra"
];

const SUFFIXES = [
    "ns", "x", "r", "th", "g", "k", "l", "m", "n", "s", "z", "d", 
    "ianos", "oides", "itas", "anos", "enitas", "ares", "oros", "urus"
];

export class SpeciesGenerator {
    static generateName() {
        const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        const m = MIDDLES[Math.floor(Math.random() * MIDDLES.length)];
        const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
        return p + m + s;
    }

    static generateSpecies(count = 1) {
        const speciesMap = {};
        for (let i = 0; i < count; i++) {
            const name = this.generateName();
            const alignment = Alignments[Math.floor(Math.random() * Alignments.length)];
            const hue = alignment.colorBase[0] + Math.random() * (alignment.colorBase[1] - alignment.colorBase[0] || 360);
            const color = `hsl(${Math.floor(hue)}, 70%, 50%)`;
            
            // Exploration Drive: 0.0 (Caseiro) a 1.0 (Nômade/Curioso)
            // Pacíficos tendem a ser mais caseiros, Agressivos e Expansivos têm alto drive.
            let expDrive = Math.random() * 0.5;
            if (alignment.traits.includes('expansionist')) expDrive += 0.5;
            if (alignment.traits.includes('survivalist')) expDrive += 0.2;

            const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');

            speciesMap[id] = {
                id: id,
                name: name,
                baseColor: color,
                alignment: alignment.id,
                traits: [...alignment.traits],
                explorationDrive: Math.min(1.0, Math.max(0.01, expDrive))
            };
        }
        return speciesMap;
    }
}
