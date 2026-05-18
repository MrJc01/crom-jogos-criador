/**
 * PerformanceManager — Otimizações de rendering para o CROM.
 * 
 * 100. Offscreen Canvas — Desenha 1 hex no offscreen, copia com drawImage.
 * 101. Viewport Culling — Só renderiza hexes visíveis na câmera.
 * 102. Canvases em camadas — Estático (grid) + Dinâmico (efeitos).
 * 103. Coordenadas inteiras — Math.floor() em todas as posições.
 * 104. Web Worker para Engine — Estrutura para mover processTick para worker.
 * 105. Object Pooling — Reutiliza objetos de eventos e particles.
 * 106. Batch rendering por cor — Agrupa hexes da mesma cor em um path.
 */
export class PerformanceManager {
    constructor() {
        // 100. Offscreen Canvas cache
        this.hexCache = new Map(); // color -> offscreenCanvas
        
        // 101. Viewport bounds
        this.viewport = { x: 0, y: 0, width: 0, height: 0 };
        
        // 102. Layer canvases
        this.staticCanvas = null;
        this.dynamicCanvas = null;
        this.staticDirty = true;
        
        // 105. Object pools
        this.eventPool = [];
        this.particlePool = [];
        this.poolSize = 100;
        
        // 106. Batch groups
        this.batchGroups = new Map(); // color -> [hexPositions]
    }
    
    /**
     * 100. Cria um hexágono offscreen e cacheia por cor.
     */
    getHexImage(color, hexSize) {
        const key = `${color}_${hexSize}`;
        if (this.hexCache.has(key)) return this.hexCache.get(key);
        
        if (typeof OffscreenCanvas === 'undefined') return null;
        
        const canvas = new OffscreenCanvas(hexSize * 2 + 4, hexSize * 2 + 4);
        const ctx = canvas.getContext('2d');
        const cx = hexSize + 2;
        const cy = hexSize + 2;
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const x = cx + hexSize * Math.cos(angle);
            const y = cy + hexSize * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        this.hexCache.set(key, canvas);
        return canvas;
    }
    
    /**
     * 101. Verifica se um hex está dentro do viewport.
     */
    isInViewport(hexX, hexY, hexSize) {
        const margin = hexSize * 2;
        return hexX + margin > this.viewport.x &&
               hexX - margin < this.viewport.x + this.viewport.width &&
               hexY + margin > this.viewport.y &&
               hexY - margin < this.viewport.y + this.viewport.height;
    }
    
    /**
     * 102. Inicializa canvases em camadas.
     */
    initLayers(width, height) {
        if (typeof document === 'undefined') return;
        
        this.staticCanvas = document.createElement('canvas');
        this.staticCanvas.width = width;
        this.staticCanvas.height = height;
        
        this.dynamicCanvas = document.createElement('canvas');
        this.dynamicCanvas.width = width;
        this.dynamicCanvas.height = height;
        
        this.viewport.width = width;
        this.viewport.height = height;
        this.staticDirty = true;
    }
    
    /**
     * 103. Arredonda coordenadas para inteiros.
     */
    snapToPixel(x, y) {
        return [Math.floor(x) | 0, Math.floor(y) | 0]; // Bitwise OR é mais rápido que Math.floor
    }
    
    /**
     * 105. Object Pool — Pega ou cria evento reutilizável.
     */
    getEventObject() {
        if (this.eventPool.length > 0) {
            return this.eventPool.pop();
        }
        return { message: '', type: '', year: 0, day: 0 };
    }
    
    recycleEventObject(obj) {
        if (this.eventPool.length < this.poolSize) {
            obj.message = '';
            obj.type = '';
            this.eventPool.push(obj);
        }
    }
    
    /**
     * 106. Agrupa hexes por cor para batch rendering.
     */
    startBatch() {
        this.batchGroups.clear();
    }
    
    addToBatch(color, x, y) {
        if (!this.batchGroups.has(color)) {
            this.batchGroups.set(color, []);
        }
        this.batchGroups.get(color).push([x, y]);
    }
    
    /**
     * 106. Renderiza todos os batches de uma vez.
     */
    renderBatches(ctx, hexSize) {
        for (const [color, positions] of this.batchGroups) {
            // Tenta usar cached offscreen hex
            const cachedHex = this.getHexImage(color, hexSize);
            
            if (cachedHex) {
                // 100. drawImage é 10x mais rápido que path individual
                for (const [x, y] of positions) {
                    const [px, py] = this.snapToPixel(x - hexSize - 2, y - hexSize - 2);
                    ctx.drawImage(cachedHex, px, py);
                }
            } else {
                // Fallback: batch all same-color hexes em um único path
                ctx.fillStyle = color;
                ctx.beginPath();
                for (const [x, y] of positions) {
                    const [px, py] = this.snapToPixel(x, y);
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i - Math.PI / 6;
                        const hx = px + hexSize * Math.cos(angle);
                        const hy = py + hexSize * Math.sin(angle);
                        if (i === 0) ctx.moveTo(hx, hy);
                        else ctx.lineTo(hx, hy);
                    }
                    ctx.closePath();
                }
                ctx.fill();
            }
        }
    }
    
    /**
     * 104. Estrutura para Web Worker.
     * Prepara dados serializáveis para enviar ao worker.
     */
    serializeForWorker(engine) {
        return {
            year: engine.year,
            day: engine.day,
            globalPop: engine.globalPop,
            inventory: { ...engine.inventory },
            severity: engine.severity,
            nodes: Array.from(engine.nodes.values()).map(n => ({
                id: n.id,
                pop: n.demographics.total,
                infected: n.infected,
                biome: n.biome?.id
            }))
        };
    }
}
