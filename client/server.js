import http from 'http';
import fs from 'fs';

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/save') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            fs.writeFileSync('public/hex_map.json', body);
            const data = JSON.parse(body);
            console.log(`hex_map.json salvo com sucesso! Total: ${data.length} hexes.`);
            res.writeHead(200);
            res.end('ok');
            setTimeout(() => process.exit(0), 1000);
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(3001, () => {
    console.log('Servidor auxiliar rodando na porta 3001... Esperando o Frontend enviar o mapa!');
});
