import { Graphics } from 'pixi.js';

export class Animal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        this.radius = 16;
        this.speed = 145;
        this.isTamed = false;
        this.owner = null;
        
        this.maxHealth = 40;
        this.health = 40;
        
        this._wanderTimer = 0;
        this._dir = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 };
        
        this.gfx = new Graphics();
        this.draw();
        this.gfx.position.set(this.x, this.y);
    }
    
    addTo(container) {
        container.addChild(this.gfx);
    }
    
    draw() {
        this.gfx.clear();
        const color = this.isTamed ? 0x7c3aed : 0xf59e0b;
        this.gfx.circle(0, 0, this.radius).fill({ color });
        this.gfx.circle(0, 0, this.radius).stroke({ width: 3, color: 0x0b1220, alpha: 0.7 });
    }
    
    tame(player) {
        this.isTamed = true;
        this.owner = player;
        this.draw();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            return true;
        }
        return false;
    }
    
    respawn(worldWidth, worldHeight) {
        this.isTamed = false;
        this.owner = null;
        this.health = this.maxHealth;
        this.x = 200 + Math.random() * (worldWidth - 400);
        this.y = 200 + Math.random() * (worldHeight - 400);
        this.gfx.position.set(this.x, this.y);
        this.draw();
    }
    
    update(dt, player, worldWidth, worldHeight) {
        if (this.isTamed && this.owner) {
            const dx = this.owner.x - this.x;
            const dy = this.owner.y - this.y;
            const d = Math.hypot(dx, dy);
            
            if (d > 40) {
                const nx = dx / d;
                const ny = dy / d;
                this.x += nx * this.speed * dt;
                this.y += ny * this.speed * dt;
            }
        } else {
            this._wanderTimer -= dt;
            if (this._wanderTimer <= 0) {
                this._wanderTimer = 0.6 + Math.random() * 1.0;
                this._dir = { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 };
                const len = Math.hypot(this._dir.x, this._dir.y) || 1;
                this._dir.x /= len;
                this._dir.y /= len;
            }
            
            const avoidDx = this.x - player.x;
            const avoidDy = this.y - player.y;
            const avoidD = Math.hypot(avoidDx, avoidDy);
            if (avoidD < 120) {
                const nx = avoidDx / (avoidD || 1);
                const ny = avoidDy / (avoidD || 1);
                this.x += nx * this.speed * dt;
                this.y += ny * this.speed * dt;
            } else {
                this.x += this._dir.x * this.speed * 0.35 * dt;
                this.y += this._dir.y * this.speed * 0.35 * dt;
            }
        }
        
        const pad = 40;
        this.x = Math.max(pad, Math.min(worldWidth - pad, this.x));
        this.y = Math.max(pad, Math.min(worldHeight - pad, this.y));
        
        this.gfx.position.set(this.x, this.y);
    }
}

