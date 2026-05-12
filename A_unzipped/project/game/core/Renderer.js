export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particleSystem = [];
        this.effects = [];
    }
    
    async init() {
        // Initialize rendering settings
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        console.log('Renderer initialized');
    }
    
    drawCircle(x, y, radius, color, stroke = false) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        if (stroke) {
            this.ctx.strokeStyle = stroke;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        this.ctx.fill();
    }
    
    drawRect(x, y, width, height, color, stroke = false) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
        
        if (stroke) {
            this.ctx.strokeStyle = stroke;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, width, height);
        }
    }
    
    drawText(text, x, y, options = {}) {
        const {
            font = '16px Orbitron',
            color = '#ffffff',
            align = 'center',
            baseline = 'middle',
            stroke = false,
            strokeColor = '#000000',
            strokeWidth = 2
        } = options;
        
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        
        if (stroke) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.strokeText(text, x, y);
        }
        
        this.ctx.fillText(text, x, y);
    }
    
    drawGradientCircle(x, y, radius, colors) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        colors.forEach((color, index) => {
            gradient.addColorStop(index / (colors.length - 1), color);
        });
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawHealthBar(x, y, width, height, currentHealth, maxHealth) {
        const healthPercent = currentHealth / maxHealth;
        
        // Background
        this.drawRect(x, y, width, height, 'rgba(0, 0, 0, 0.5)');
        
        // Health bar
        const healthColor = healthPercent > 0.6 ? '#2ed573' : 
                           healthPercent > 0.3 ? '#ffa502' : '#ff4757';
        this.drawRect(x, y, width * healthPercent, height, healthColor);
        
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
    }
    
    addParticle(x, y, type, options = {}) {
        const particle = {
            x,
            y,
            type,
            life: 1.0,
            maxLife: options.life || 1.0,
            velocity: options.velocity || { x: 0, y: 0 },
            color: options.color || '#ffffff',
            size: options.size || 3,
            ...options
        };
        
        this.particleSystem.push(particle);
    }
    
    updateParticles(deltaTime) {
        this.particleSystem = this.particleSystem.filter(particle => {
            particle.life -= deltaTime;
            particle.x += particle.velocity.x * deltaTime;
            particle.y += particle.velocity.y * deltaTime;
            
            if (particle.gravity) {
                particle.velocity.y += particle.gravity * deltaTime;
            }
            
            return particle.life > 0;
        });
    }
    
    renderParticles() {
        this.particleSystem.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            
            if (particle.type === 'spark') {
                this.drawCircle(particle.x, particle.y, particle.size, particle.color);
            } else if (particle.type === 'text') {
                this.drawText(particle.text, particle.x, particle.y, {
                    color: particle.color,
                    font: `${particle.size}px Orbitron`
                });
            }
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    addEffect(type, x, y, options = {}) {
        const effect = {
            type,
            x,
            y,
            time: 0,
            duration: options.duration || 1.0,
            ...options
        };
        
        this.effects.push(effect);
    }
    
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.time += deltaTime;
            return effect.time < effect.duration;
        });
    }
    
    renderEffects() {
        this.effects.forEach(effect => {
            const progress = effect.time / effect.duration;
            
            if (effect.type === 'tame') {
                this.renderTameEffect(effect, progress);
            } else if (effect.type === 'gather') {
                this.renderGatherEffect(effect, progress);
            } else if (effect.type === 'attack') {
                this.renderAttackEffect(effect, progress);
            }
        });
    }
    
    renderTameEffect(effect, progress) {
        const radius = 30 + progress * 20;
        const alpha = 1 - progress;
        
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = '#5f27cd';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1.0;
    }
    
    renderGatherEffect(effect, progress) {
        const size = 5 + progress * 10;
        const alpha = 1 - progress;
        
        this.ctx.globalAlpha = alpha;
        this.drawCircle(effect.x, effect.y - progress * 30, size, '#00d2d3');
        this.ctx.globalAlpha = 1.0;
    }
    
    renderAttackEffect(effect, progress) {
        const size = 20 - progress * 15;
        const alpha = 1 - progress;
        
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = '#ff4757';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
    }
}