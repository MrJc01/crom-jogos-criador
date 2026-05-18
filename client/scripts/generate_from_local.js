import fs from 'fs';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

async function generate() {
    console.log("Lendo mapa local...");
    const rawData = fs.readFileSync('/home/j/.gemini/antigravity/brain/7a08cfb2-5458-4018-9421-dae66d0d220d/.system_generated/steps/1388/content.md', 'utf-8');
    
    // Limpar formatação markdown (```json ... ```) se houver
    let cleanData = rawData.trim();
    if (cleanData.startsWith('```')) {
        const lines = cleanData.split('\n');
        lines.shift();
        if (lines[lines.length-1].startsWith('```')) lines.pop();
        cleanData = lines.join('\n');
    }
    
    const world = JSON.parse(cleanData);
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
    
    console.log(`Verificando colunas: ${cols}, linhas: ${rows}. Total grid = ${cols * rows}`);

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

    console.log(`[1/2] ${hexes.length} Hexágonos em Terra Firme gerados! Calculando Vizinhança...`);

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

    console.log(`[2/2] Vizinhança calculada. Salvando JSON...`);
    
    if (!fs.existsSync('./public')) fs.mkdirSync('./public');
    fs.writeFileSync('./public/hex_map.json', JSON.stringify(hexes));
    console.log(`Sucesso! Mapa salvo em public/hex_map.json`);
}

generate().catch(console.error);
