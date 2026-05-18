/**
 * MapOverlays — Camadas visuais sobrepostas ao mapa.
 * 
 * 074. Indicadores Visuais de Desastre — Ícones piscantes
 * 075. Linhas de Fluxo de Migração — Setas quando pop move
 * 076. Mapa Hídrico do Aquífero — Camada visual água subterrânea
 * 077. Mapa de Calor Climático — Visualização termal
 * 070. Destaque Visual em HEX — Flash em eventos diplomáticos
 */
export class MapOverlays {
    constructor(mapRenderer, engine) {
        this.map = mapRenderer;
        this.engine = engine;
        this.activeDisasters = new Map(); // nodeId -> { type, timeout }
        this.activeFlashes = [];
    }
    
    // =============================================
    // 074. Indicadores Visuais de Desastre
    // =============================================
    showDisasterIndicator(nodeId, type) {
        if (!this.map.hexNodes) return;
        const hex = this.map.hexNodes.find(h => h.id === nodeId);
        if (!hex) return;
        
        const icons = {
            'disaster': '💥', 'volcanic': '🌋', 'earthquake': '🌊',
            'pandemic': '🦠', 'war': '⚔️', 'meteor': '☄️',
            'famine': '🍞', 'drought': '🏜️', 'nemesis': '👹'
        };
        
        const icon = icons[type] || '⚠️';
        
        // Cria indicador piscante
        const indicator = this.map.bubblesLayer.append('text')
            .attr('x', hex.x)
            .attr('y', hex.y - 4)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('pointer-events', 'none')
            .text(icon)
            .attr('opacity', 0);
        
        // Animação piscante (3 ciclos)
        indicator
            .transition().duration(200).attr('opacity', 1)
            .transition().duration(200).attr('opacity', 0.2)
            .transition().duration(200).attr('opacity', 1)
            .transition().duration(200).attr('opacity', 0.2)
            .transition().duration(200).attr('opacity', 1)
            .transition().duration(1500).attr('opacity', 0)
            .on('end', () => indicator.remove());
        
        // Flash no hex (070)
        this.map.animateBlink(nodeId, '#ff4444');
    }
    
    // =============================================
    // 075. Linhas de Fluxo de Migração
    // =============================================
    showMigrationFlow(sourceId, targetId, count) {
        if (!this.map.hexNodes) return;
        const h1 = this.map.hexNodes.find(h => h.id === sourceId);
        const h2 = this.map.hexNodes.find(h => h.id === targetId);
        if (!h1 || !h2) return;
        
        // Linha tracejada com seta
        const line = this.map.bubblesLayer.append('line')
            .attr('x1', h1.x).attr('y1', h1.y)
            .attr('x2', h1.x).attr('y2', h1.y) // Começa no mesmo ponto
            .style('stroke', '#f39c12')
            .style('stroke-width', Math.min(3, count / 100))
            .style('stroke-dasharray', '2,2')
            .style('opacity', 0.7);
        
        // Anima a linha se estendendo
        line.transition().duration(1500)
            .attr('x2', h2.x).attr('y2', h2.y)
            .transition().duration(500)
            .style('opacity', 0)
            .on('end', () => line.remove());
        
        // Ícone de migrante
        const migrant = this.map.bubblesLayer.append('text')
            .attr('x', h1.x).attr('y', h1.y)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('pointer-events', 'none')
            .text('🚶')
            .attr('opacity', 0.8);
        
        migrant.transition().duration(2000)
            .attr('x', h2.x).attr('y', h2.y)
            .attr('opacity', 0)
            .on('end', () => migrant.remove());
    }
    
    // =============================================
    // 076. Mapa Hídrico do Aquífero
    // =============================================
    renderAquiferOverlay(ctx, hexNodes, transform) {
        if (!hexNodes) return;
        
        ctx.save();
        ctx.globalAlpha = 0.4;
        
        for (const hex of hexNodes) {
            const node = this.engine.nodes.get(hex.id);
            if (!node?.infected) continue;
            
            const water = node.resources?.water || 0;
            const depth = node.aquiferDepth || 1.0;
            
            // Cor: azul (muita água) → vermelho (seca)
            const ratio = Math.min(1, water / 50000);
            const r = Math.floor(255 * (1 - ratio));
            const b = Math.floor(255 * ratio);
            
            ctx.fillStyle = `rgb(${r}, 50, ${b})`;
            ctx.beginPath();
            ctx.arc(
                hex.x * transform.k + transform.x,
                hex.y * transform.k + transform.y,
                2 * transform.k * (1 / depth), // Menor = aquífero profundo
                0, Math.PI * 2
            );
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // =============================================
    // 077. Mapa de Calor Climático
    // =============================================
    renderClimateOverlay(ctx, hexNodes, transform) {
        if (!hexNodes) return;
        
        const temp = this.engine.globalTemp || 0;
        if (Math.abs(temp) < 0.1) return; // Sem overlay se temp neutral
        
        ctx.save();
        ctx.globalAlpha = Math.min(0.5, Math.abs(temp) * 0.1);
        
        // Gradiente global: quente = vermelho, frio = azul
        if (temp > 0) {
            ctx.fillStyle = `rgba(255, ${Math.max(0, 100 - temp * 20)}, 0, ${Math.min(0.3, temp * 0.05)})`;
        } else {
            ctx.fillStyle = `rgba(0, ${Math.max(0, 100 + temp * 20)}, 255, ${Math.min(0.3, Math.abs(temp) * 0.05)})`;
        }
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Labels de temperatura
        ctx.fillStyle = temp > 0 ? '#ff4444' : '#4444ff';
        ctx.font = '12px monospace';
        ctx.fillText(`🌡️ ${temp > 0 ? '+' : ''}${temp.toFixed(1)}°C`, 10, 20);
        
        ctx.restore();
    }
    
    // =============================================
    // 070. Flash diplomático em hex
    // =============================================
    flashDiplomacy(nodeId) {
        this.map.animateBlink(nodeId, '#00aaff');
    }
    
    flashWar(nodeId) {
        this.map.animateBlink(nodeId, '#ff0000');
    }
    
    flashTech(nodeId) {
        this.map.animateBlink(nodeId, '#ffdd00');
    }
}
