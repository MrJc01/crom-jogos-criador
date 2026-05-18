import * as d3 from 'd3';

export class MicroSimRenderer {
    constructor(engine, hexNodes) {
        this.engine = engine;
        this.hexNodes = hexNodes; // array original {id, x, y}
        this.activeCitizens = new Map(); // hexId -> array de partículas
        
        // Inicia o loop de física de partículas
        this.startAnimationLoop();
    }
    
    startAnimationLoop() {
        const loop = () => {
            this.animateCitizens();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
    
    // Chamado pelo loop de renderização ou durante o Zoom
    updateVisible(layer, currentTransform, width, height) {
        if (!this.hexNodes) return;
        
        const zoomLevel = currentTransform.k;
        // Oculta se o zoom for menor que 8
        if (zoomLevel < 8) {
            layer.selectAll('.micro-group').remove();
            this.activeCitizens.clear();
            return;
        }

        const margin = 10;
        
        // Abate de Viewport O(N) super rápido
        const visibleHexes = [];
        for (let i = 0; i < this.hexNodes.length; i++) {
            const h = this.hexNodes[i];
            const viewX = h.x * currentTransform.k + currentTransform.x;
            const viewY = h.y * currentTransform.k + currentTransform.y;
            
            // Só processa quem está fisicamente na tela
            if (viewX < -margin || viewX > width + margin || viewY < -margin || viewY > height + margin) {
                continue;
            }
            
            const node = this.engine.nodes.get(h.id);
            if (node && node.infected && node.demographics.total > 0 && node.infrastructure) {
                visibleHexes.push({h, node});
            }
        }
        
        // Data binding do D3 (Associa os dados aos nós SVG da tela)
        const groups = layer.selectAll('.micro-group')
            .data(visibleHexes, d => d.h.id);
            
        // EXIT: Hexágonos que saíram da tela são destruídos para economizar RAM
        groups.exit().each((d) => {
            this.activeCitizens.delete(d.h.id);
        }).remove();
        
        // ENTER: Hexágonos que acabaram de entrar na tela ganham vida
        const enterGroups = groups.enter().append('g')
            .attr('class', 'micro-group')
            .attr('transform', d => `translate(${d.h.x}, ${d.h.y})`);
            
        // Para cada novo grupo, desenha as construções dinamicamente (1 única vez)
        enterGroups.each((d, i, nodes) => {
            const g = d3.select(nodes[i]);
            const infra = d.node.infrastructure;
            
            // Construção: Agricultura (Cima)
            if (infra.agriculture > 0.05) {
                g.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('dy', '-0.5px')
                    .attr('font-size', `${infra.agriculture * 1.5 + 0.5}px`)
                    .text('🌾');
            }
            
            // Construção: Urbana (Centro)
            if (infra.urban > 0.05) {
                let icon = d.node.demographics.total > 50000 ? '🏙️' : (d.node.demographics.total > 1000 ? '🏘️' : '⛺');
                g.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('dy', '0.5px')
                    .attr('font-size', `${infra.urban * 1.5 + 0.5}px`)
                    .text(icon);
            }
            
            // Construção: Militar (Esquerda)
            if (infra.military > 0.05) {
                let icon = d.node.veteranBuff > 5 ? '🏰' : '⚔️';
                g.append('text')
                    .attr('text-anchor', 'end')
                    .attr('dx', '-0.5px')
                    .attr('font-size', `${infra.military * 1.5 + 0.5}px`)
                    .text(icon);
            }
            
            // Construção: Religião/Cultura (Direita)
            if (infra.religious > 0.05) {
                let icon = d.node.demographics.total > 10000 ? '⛪' : '🗿';
                g.append('text')
                    .attr('text-anchor', 'start')
                    .attr('dx', '0.5px')
                    .attr('font-size', `${infra.religious * 1.5 + 0.5}px`)
                    .text(icon);
            }
            
            // Vida Artificial: Spawna as formiguinhas neste hexágono
            this.spawnCitizens(g, d.node, d.h.id);
        });
        
        // UPDATE: Avança o frame da vida artificial (movimentação)
        this.animateCitizens();
    }
    
    spawnCitizens(g, node, hexId) {
        // Limita a 6 formiguinhas no máximo para preservar o SVG
        const count = Math.min(6, Math.ceil(node.demographics.total / 5000));
        if (count <= 0) return;
        
        // Determina o humor da população
        let citizenIcon = '🚶';
        let speed = 0.01;
        
        if (node.demographics.total > node.capacity) {
            citizenIcon = '🏃'; // Pânico/Lotação
            speed = 0.03;
        } else if (this.engine.pressures?.social > 0.7) {
            citizenIcon = '😡'; // Revolta
            speed = 0.02;
        } else if (this.engine.severity > 80) {
            citizenIcon = '🧟'; // Doença/Fome Extrema
            speed = 0.005; // Zumbis são lentos
        }
        
        const citizens = [];
        for (let i = 0; i < count; i++) {
            // Posição inicial no centro do hexágono (offset randomico)
            const cx = (Math.random() - 0.5) * 1.0;
            const cy = (Math.random() - 0.5) * 1.0;
            
            const text = g.append('text')
                .attr('text-anchor', 'middle')
                .attr('font-size', '0.5px') // Tamanho da formiguinha
                .attr('x', cx)
                .attr('y', cy)
                .style('pointer-events', 'none')
                .text(citizenIcon);
                
            citizens.push({
                element: text,
                x: cx,
                y: cy,
                dx: (Math.random() - 0.5) * speed,
                dy: (Math.random() - 0.5) * speed,
                speed: speed
            });
        }
        
        this.activeCitizens.set(hexId, citizens);
    }
    
    // Função rodada a cada tick do jogo ou evento de mousemove (60fps idealmente)
    animateCitizens() {
        for (const [hexId, citizens] of this.activeCitizens.entries()) {
            for (let c of citizens) {
                c.x += c.dx;
                c.y += c.dy;
                
                // Parede invisível do hexágono (raio aprox 1.5)
                // Se bater na borda, inverte o vetor
                if (c.x < -1.2 || c.x > 1.2) c.dx *= -1;
                if (c.y < -1.2 || c.y > 1.2) c.dy *= -1;
                
                // Pequena chance (5%) de mudar direção aleatoriamente no meio do caminho
                if (Math.random() < 0.05) {
                    c.dx = (Math.random() - 0.5) * c.speed;
                    c.dy = (Math.random() - 0.5) * c.speed;
                }
                
                c.element.attr('x', c.x).attr('y', c.y);
            }
        }
    }
}
