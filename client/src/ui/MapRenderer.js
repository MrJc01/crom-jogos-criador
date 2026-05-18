import * as d3 from 'd3';
import * as topojson from 'topojson-client';

export class MapRenderer {
    constructor(containerId, engine, uiCallbacks) {
        this.engine = engine;
        this.uiCallbacks = uiCallbacks;
        
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.svg = d3.select(containerId).append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
            
        this.projection = d3.geoMercator().scale(180).translate([this.width / 2, this.height / 1.5]);
        this.path = d3.geoPath().projection(this.projection);
        
        this.g = this.svg.append('g');
        this.mapLayer = this.g.append('g').attr('class', 'map-layer');
        this.seaRoutesLayer = this.g.append('g').attr('class', 'sea-routes');
        this.bubblesLayer = this.g.append('g').attr('class', 'bubbles-layer');
        
        this.svg.call(d3.zoom().scaleExtent([0.5, 8]).on('zoom', (event) => {
            this.g.attr('transform', event.transform);
        }));
    }
    
    async init() {
        console.log("Inicializando MapRenderer orgânico...");
        
        try {
            const res = await fetch('/hex_map.json');
            if (!res.ok) throw new Error("Mapa não encontrado");
            this.hexNodes = await res.json();
            console.log(`Carregado mapa pré-gerado com ${this.hexNodes.length} hexágonos!`);
            
            // Oculta a tela de loading
            document.getElementById('loading-screen').style.display = 'none';
        } catch (e) {
            console.error("FATAL: Mapa não encontrado!");
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.innerHTML = "<h2 style='color:red;'>Erro: Mapa não encontrado. Execute 'node scripts/generate_hex_map.js' no terminal.</h2>";
            }
            return;
        }

        this.engine.initWorld(this.hexNodes);
        
        this.renderPaths();
        this.update();
        
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 8])
            .on("zoom", (event) => {
                // Mover a camada de SVG interativa
                this.g.attr("transform", event.transform);
                
                // Redesenhar o Canvas de alta performance no fundo
                this.currentTransform = event.transform;
                this.renderCanvas();
            });
            
        this.svg.call(this.zoom);
    }
    
    getFactionColor(name) {
        if (!this.factionColors) {
            this.factionColors = {
                'Tribal': '#8b4513',
                'expansionistas_militares': '#e74c3c',
                'tecnocratas': '#3498db',
                'espiritualistas': '#9b59b6',
                'corporatist': '#f1c40f',
                'eco_rebeldes': '#2ecc71',
                'isolacionistas': '#7f8c8d'
            };
        }
        if (this.factionColors[name]) return this.factionColors[name];
        let hash = 0;
        for(let i=0; i<name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
    }

    renderPaths() {
        // Setup Canvas
        this.canvas = document.getElementById('map-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.currentTransform = d3.zoomIdentity;
        this.currentLayer = 'populacional'; // Camada padrão

        // Listener para os botões de camadas no UI
        const layerBtns = document.querySelectorAll('.layer-btn');
        layerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                layerBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentLayer = e.target.getAttribute('data-layer');
                this.update();
            });
        });

        // Setup interações O(N) super rápidas no container
        d3.select('#worldCanvas')
            .on('mousemove', (event) => this.handleInteraction(event, 'hover'))
            .on('mouseout', () => this.uiCallbacks.onMouseOut())
            .on('click', (event) => this.handleInteraction(event, 'click'));
    }
    
    handleInteraction(event, type) {
        if (!this.hexNodes) return;
        const transform = this.currentTransform;
        const [mx, my] = d3.pointer(event);
        const x = (mx - transform.x) / transform.k;
        const y = (my - transform.y) / transform.k;
        
        let minDist = Infinity;
        let closestHex = null;
        
        // Fast bounding box O(N)
        for(let i = 0; i < this.hexNodes.length; i++) {
            const h = this.hexNodes[i];
            const dx = h.x - x;
            const dy = h.y - y;
            if(Math.abs(dx) > 3 || Math.abs(dy) > 3) continue;
            
            const dist = dx*dx + dy*dy;
            if (dist < minDist) {
                minDist = dist;
                closestHex = h;
            }
        }
        
        if (closestHex && minDist <= 4) { // radius=2 -> r^2=4
            const node = this.engine.nodes.get(closestHex.id);
            if (node) {
                if (type === 'hover') this.uiCallbacks.onHover(node, event);
                else if (type === 'click') this.uiCallbacks.onClick(node);
            }
        } else {
            if (type === 'hover') this.uiCallbacks.onMouseOut();
        }
    }

    update() {
        this.renderCanvas();
        this.renderSeaRoutes();
    }
    
    renderCanvas() {
        if (!this.hexNodes || !this.ctx) return;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.save();
        this.ctx.translate(this.currentTransform.x, this.currentTransform.y);
        this.ctx.scale(this.currentTransform.k, this.currentTransform.k);
        
        const hexRadius = 2;
        const colorBatches = {};
        
        const zoomLevel = this.currentTransform.k;
        
        // Culling e Batching
        const margin = hexRadius * 2 * zoomLevel;
        
        for(let i = 0; i < this.hexNodes.length; i++) {
            const d = this.hexNodes[i];
            const viewX = d.x * this.currentTransform.k + this.currentTransform.x;
            const viewY = d.y * this.currentTransform.k + this.currentTransform.y;
            
            // Viewport Culling
            if (viewX < -margin || viewX > this.width + margin || viewY < -margin || viewY > this.height + margin) {
                continue;
            }

            const node = this.engine.nodes.get(d.id);
            let color = '#222';
            
            if (node) {
                let baseColor = '#555';
                if (node.biome) {
                    if (node.biome.id === 'desert') baseColor = '#e3c16f';
                    else if (node.biome.id === 'tundra') baseColor = '#dcf2f2';
                    else if (node.biome.id === 'plains') baseColor = '#6ab04c';
                    else if (node.biome.id === 'jungle') baseColor = '#2d6b35';
                }

                // Aplica a lógica da Lente/Camada atual
                if (this.currentLayer === 'normal') {
                    // Apenas Biomas Físicos
                    color = baseColor;
                } 
                else if (this.currentLayer === 'recursos') {
                    // Mapa de Riqueza Naturais (Madeira, Minério, Terra Fértil)
                    if (node.biome.id === 'plains') color = '#27ae60'; // Mais madeira/comida
                    else if (node.biome.id === 'desert' || node.biome.id === 'tundra') color = '#7f8c8d'; // Minérios
                    else if (node.biome.id === 'jungle') color = '#1abc9c'; // Biodiversidade
                    else color = baseColor;
                    
                    // Escurece os explorados
                    if (node.demographics.total > node.capacity * 0.8) {
                        color = d3.color(color).darker(1).toString();
                    }
                }
                else if (this.currentLayer === 'desastres') {
                    // Mapa de Severidade Planetária e Perigos
                    let severity = (node.demographics.total / node.capacity); // Simulando severidade
                    if (severity < 0.2) color = '#111'; // Ok
                    else if (severity < 0.6) color = '#d35400'; // Aviso
                    else color = '#c0392b'; // Perigo Crítico (Desastres Iminentes)
                    if (node.biome.id === 'desert' && severity > 0.5) color = '#f39c12'; // Seca extrema
                }
                else {
                    // Camada 'populacional' (Demografia) Padrão
                    if (node.infected && node.demographics.total > 0) {
                        let domFac = 'Tribal';
                        let maxPct = 0;
                        for (const [fac, pct] of Object.entries(node.demographics.dist.factions)) {
                            if (pct > maxPct) { maxPct = pct; domFac = fac; }
                        }
                        const facColor = this.getFactionColor(domFac);
                        const ratio = Math.max(0.1, Math.min(1, node.demographics.total / node.capacity));
                        color = d3.interpolateLab(baseColor, facColor)(ratio * 0.9);
                    } else {
                        color = baseColor;
                    }
                }
            }
            
            if (!colorBatches[color]) colorBatches[color] = [];
            colorBatches[color].push(d);
        }

        // Draw Batches ultra-rápido
        this.ctx.lineWidth = 0.1;
        this.ctx.strokeStyle = '#1a4a6e';
        
        // Precalcular offsets do hexágono para não calcular sin/cos milhares de vezes
        const hexOffsets = [];
        for (let i = 0; i < 6; i++) {
            const angle_rad = Math.PI / 180 * (60 * i);
            hexOffsets.push({ x: hexRadius * Math.cos(angle_rad), y: hexRadius * Math.sin(angle_rad) });
        }
        
        const isFarZoom = zoomLevel < 1.5;

        for (const color in colorBatches) {
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            const hexes = colorBatches[color];
            
            for(let j = 0; j < hexes.length; j++) {
                const h = hexes[j];
                
                if (isFarZoom) {
                    // Quando muito longe, desenhar um pequeno quadrado é muito mais rápido e visualmente quase idêntico
                    this.ctx.rect(h.x - hexRadius, h.y - hexRadius, hexRadius * 2, hexRadius * 2);
                } else {
                    for (let i = 0; i < 6; i++) {
                        const px = h.x + hexOffsets[i].x;
                        const py = h.y + hexOffsets[i].y;
                        if (i === 0) this.ctx.moveTo(px, py);
                        else this.ctx.lineTo(px, py);
                    }
                    this.ctx.closePath();
                }
            }
            
            this.ctx.fill();
            if (!isFarZoom) {
                this.ctx.stroke(); // O stroke gasta muito FPS quando estamos longe e as bordas quase não aparecem
            }
        }
        
        this.ctx.restore();
    }
    
    renderSeaRoutes() {
        const routes = this.seaRoutesLayer.selectAll('.sea-route').data(this.engine.tradeRoutes);
        routes.exit().remove();
        routes.enter().append('path').attr('class', 'sea-route').attr('d', d => {
            const h1 = this.hexNodes.find(h => h.id === d.sourceId);
            const h2 = this.hexNodes.find(h => h.id === d.targetId);
            if(h1 && h2) {
               return `M${h1.x},${h1.y} Q${(h1.x+h2.x)/2},${h1.y-100} ${h2.x},${h2.y}`;
            }
            return null;
        }).style('fill', 'none')
          .style('stroke-dasharray', d => d.type === 'air' ? '2,2' : (d.type === 'rail' ? '5,5' : '0'))
          .style('stroke', d => d.type === 'air' ? '#ecf0f1' : (d.type === 'rail' ? '#e67e22' : '#3498db'));
    }
    
    getColorRatio(baseHex, ratio) {
        const color = d3.color(baseHex);
        color.opacity = ratio;
        return color.toString();
    }

    spawnBubble(data) {
        if (!this.hexNodes) return;
        const hex = this.hexNodes.find(h => h.id === data.nodeId);
        if (!hex) return;
        
        const group = this.bubblesLayer.append('g')
            .attr('transform', `translate(${hex.x}, ${hex.y})`)
            .style('cursor', 'pointer');
            
        const color = data.type === 'dna' ? '#ffaa00' : '#ff4444';
        const icon = data.type === 'dna' ? '🧬' : '🔴';
        
        const circle = group.append('circle')
            .attr('r', 0)
            .attr('fill', color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8);
            
        // Efeito de Respiração (Breathing)
        circle.transition().duration(500).attr('r', 18)
              .transition().duration(1000).attr('r', 15)
              .transition().duration(1000).attr('r', 18)
              .on("end", function repeat() {
                  d3.active(this).transition().duration(1000).attr('r', 15)
                    .transition().duration(1000).attr('r', 18)
                    .transition().on("start", repeat);
              });
              
        const text = group.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .attr('font-size', '16px')
            .style('pointer-events', 'none')
            .text(icon);
            
        text.attr('opacity', 0).transition().duration(500).attr('opacity', 1);
        
        // As bolhas somem sozinhas se ignoradas após 8 segundos
        const timeout = setTimeout(() => {
            group.transition().duration(500).attr('opacity', 0).remove();
        }, 8000);
        
        group.on('click', () => {
            clearTimeout(timeout);
            // Callback para a UI coletar
            if (this.uiCallbacks.onBubbleClick) this.uiCallbacks.onBubbleClick(data.type);
            
            // Animação de Estouro
            circle.transition().duration(200).attr('r', 30).attr('opacity', 0);
            text.transition().duration(200).attr('dy', '-1em').attr('opacity', 0);
            group.transition().delay(200).remove();
        });
    }

    animateMigration(data) {
        if (!this.hexNodes) return;
        const h1 = this.hexNodes.find(h => h.id === data.sourceId);
        const h2 = this.hexNodes.find(h => h.id === data.targetId);
        if (!h1 || !h2) return;

        const p1 = [h1.x, h1.y];
        const p2 = [h2.x, h2.y];

        let icon = '🚶';
        if (data.type === 'sea') icon = '🚢';
        if (data.type === 'rail') icon = '🚂';
        if (data.type === 'air') icon = '✈️';

        const particle = this.bubblesLayer.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .attr('font-size', '18px')
            .style('pointer-events', 'none')
            .text(icon)
            .attr('transform', `translate(${p1[0]}, ${p1[1]})`);

        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Math.max(1000, dist * 8);

        particle.transition()
            .duration(duration)
            .ease(d3.easeCubicInOut)
            .attrTween('transform', function() {
                return function(t) {
                    const x = p1[0] + dx * t;
                    // Adiciona um arco parabólico para o movimento
                    const y = p1[1] + dy * t - Math.sin(t * Math.PI) * 60;
                    return `translate(${x}, ${y})`;
                }
            })
            .on('end', () => {
                particle.transition().duration(200).attr('opacity', 0).remove();
            });
    }
}
