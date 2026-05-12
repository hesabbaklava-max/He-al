import { Container, Graphics } from 'pixi.js';

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
        
        this.root = new Container();
        this.shadow = new Graphics();
        this.body = new Graphics();
        this.face = new Graphics();
        
        this.root.addChild(this.shadow);
        this.root.addChild(this.body);
        this.root.addChild(this.face);
        
        this.root.position.set(this.x, this.y);
        
        this._animT = Math.random() * 10;
        this._flashT = 0;
        this._punchT = 0;
        this._punchDir = { x: 0, y: 0 };
        
        this.redraw();
    }
    
    addTo(container) {
        container.addChild(this.root);
    }
    
    redraw() {
        this.shadow.clear();
        this.shadow.ellipse(2, 10, this.radius * 0.85, this.radius * 0.42, 0).fill({ color: 0x000000, alpha: 0.22 });
        
        this.body.clear();
        const color = this.isTamed ? 0x7c3aed : 0xf59e0b;
        this.body.circle(0, 0, this.radius).fill({ color });
        this.body.circle(0, 0, this.radius).stroke({ width: 4, color: 0x0b1220, alpha: 0.7 });
        this.body.circle(-4, -4, 5).fill({ color: 0xffffff, alpha: 0.12 });
        
        this.face.clear();
        this.face.circle(-5, -4, 2.6).fill({ color: 0xffffff });
        this.face.circle(5, -4, 2.6).fill({ color: 0xffffff });
        this.face.circle(-5, -4, 1.2).fill({ color: 0x0b1220 });
        this.face.circle(5, -4, 1.2).fill({ color: 0x0b1220 });
        this.face.circle(0, 2, 2.2).fill({ color: 0x0b1220, alpha: 0.6 });
    }
    
    tame(player) {
        this.isTamed = true;
        this.owner = player;
        this.redraw();
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            return true;
        }
        this.flash();
        return false;
    }
    
    respawn(worldWidth, worldHeight) {
        this.isTamed = false;
        this.owner = null;
        this.health = this.maxHealth;
        this.x = 200 + Math.random() * (worldWidth - 400);
        this.y = 200 + Math.random() * (worldHeight - 400);
        this.root.position.set(this.x, this.y);
        this.redraw();
    }
    
    update(dt, player, worldWidth, worldHeight) {
        this._animT += dt;
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
        
        let punchX = 0;
        let punchY = 0;
        if (this._punchT > 0) {
            this._punchT -= dt;
            const k = Math.max(0, this._punchT) / 0.12;
            punchX = this._punchDir.x * (7 * k);
            punchY = this._punchDir.y * (7 * k);
        }
        
        const bob = Math.sin(this._animT * 9) * 2;
        this.root.position.set(this.x + punchX, this.y + bob + punchY);
        
        if (this._flashT > 0) {
            this._flashT -= dt;
            const k = Math.max(0, this._flashT) / 0.12;
            this.body.alpha = 0.55 + 0.45 * (1 - k);
        } else {
            this.body.alpha = 1;
        }
    }
    
    flash() {
        this._flashT = 0.12;
    }
    
    punch(dx, dy) {
        const len = Math.hypot(dx, dy) || 1;
        this._punchDir.x = dx / len;
        this._punchDir.y = dy / len;
        this._punchT = 0.12;
    }
}
