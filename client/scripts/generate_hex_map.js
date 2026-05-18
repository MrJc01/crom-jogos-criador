import fs from 'fs';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

async function generate() {
    console.log("Baixando mapa topológico do mundo...");
    const req = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
    const world = await req.json();
    
    console.log("Processando dados topológicos...");
    const landMask = topojson.merge(world, world.objects.countries.geometries);

    const width = 1920;
    const height = 1080;
    const hexRadius = 2; 
    const hexWidth = hexRadius * 2;
    const hexHeight = Math.sqrt(3) * hexRadius;
    
    const projection = d3.geoMercator().scale(180).translate([width / 2, height / 1.5]);

    const hexes = [];
    const cols = Math.ceil(width / (hexWidth * 0.75));
    const rows = Math.ceil(height / hexHeight);
    
    console.log(`Gerando malha microscópica... Colunas: ${cols}, Linhas: ${rows}. Total grid = ${cols * rows}`);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const isOdd = col % 2 !== 0;
            const cx = col * (hexWidth * 0.75);
            const cy = row * hexHeight + (isOdd ? hexHeight / 2 : 0);
            
            const coords = projection.invert([cx, cy]);
            if (coords && d3.geoContains(landMask, coords)) {
                hexes.push({
                    id: `hex_${col}_${row}`,
                    col, row,
                    x: cx, y: cy,
                    lon: coords[0], lat: coords[1]
                });
            }
        }
    }

    console.log(`[1/2] ${hexes.length} Hexágonos em Terra Firme encontrados! Mapeando Vizinhanças Orgânicas (pode demorar alguns segundos)...`);

    const hexIdSet = new Set(hexes.map(h => h.id));

    hexes.forEach(hex => {
        const neighbors = [];
        const c = hex.col;
        const r = hex.row;
        
        const dirsEven = [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
        const dirsOdd  = [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]];
        const dirs = (c % 2 === 0) ? dirsEven : dirsOdd;
        
        dirs.forEach(d => {
            const nc = c + d[0];
            const nr = r + d[1];
            const nId = `hex_${nc}_${nr}`;
            if (hexIdSet.has(nId)) neighbors.push(nId);
        });
        
        hex.neighbors = neighbors;
    });

    console.log(`[2/2] Vizinhanças calculadas com sucesso.`);
    
    if (!fs.existsSync('./public')) fs.mkdirSync('./public');
    fs.writeFileSync('./public/hex_map.json', JSON.stringify(hexes));
    console.log(`\n=================================================`);
    console.log(`SUCESSO MÁXIMO! Mapa salvo em public/hex_map.json`);
    console.log(`=================================================`);
}

generate().catch(console.error);
