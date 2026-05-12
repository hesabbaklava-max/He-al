import { Container, Graphics } from 'pixi.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.dir = { x: 1, y: 0 };
        
        this.radius = 18;
        this.speed = 260;
        
        this.maxHealth = 100;
        this.health = 100;
        this.maxHunger = 100;
        this.hunger = 100;
        this.maxThirst = 100;
        this.thirst = 100;
        
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 100;
        
        this.tamingSkill = 1;
        this.maxTamed = 3;
        
        this.attackDamage = 18;
        this.attackRange = 80;
        this.tameRange = 95;
        this.gatherRange = 85;
        
        this.inventory = {
            wood: 0,
            stone: 0,
            meat: 0,
            berry: 0
        };
        
        this.root = new Container();
        this.shadow = new Graphics();
        this.body = new Graphics();
        this.face = new Graphics();
        
        this.root.addChild(this.shadow);
        this.root.addChild(this.body);
        this.root.addChild(this.face);
        
        this.root.position.set(this.x, this.y);
        this.root.pivot.set(0, 0);
        
        this._animT = 0;
        this._flashT = 0;
        this._punchT = 0;
        this._punchDir = { x: 0, y: 0 };
        
        this._statsTimer = 0;
        
        this.redraw();
    }
    
    addTo(container) {
        container.addChild(this.root);
    }
    
    setMoveDir(x, y) {
        this.vx = x * this.speed;
        this.vy = y * this.speed;
        if (x !== 0 || y !== 0) {
            const len = Math.hypot(x, y) || 1;
            this.dir.x = x / len;
            this.dir.y = y / len;
        }
    }
    
    update(dt, worldWidth, worldHeight) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        const pad = 24;
        this.x = Math.max(pad, Math.min(worldWidth - pad, this.x));
        this.y = Math.max(pad, Math.min(worldHeight - pad, this.y));
        
        this._animT += dt;
        
        const speedK = Math.min(1, Math.hypot(this.vx, this.vy) / this.speed);
        const bob = Math.sin(this._animT * 10) * (1.5 + 2.5 * speedK);
        const tilt = (Math.atan2(this.dir.y, this.dir.x)) * 0.15;
        
        let punchX = 0;
        let punchY = 0;
        if (this._punchT > 0) {
            this._punchT -= dt;
            const k = Math.max(0, this._punchT) / 0.12;
            punchX = this._punchDir.x * (8 * k);
            punchY = this._punchDir.y * (8 * k);
        }
        
        this.root.position.set(this.x + punchX, this.y + bob + punchY);
        this.root.rotation = tilt;
        
        if (this._flashT > 0) {
            this._flashT -= dt;
            const k = Math.max(0, this._flashT) / 0.12;
            this.body.alpha = 0.6 + 0.4 * (1 - k);
        } else {
            this.body.alpha = 1;
        }
        
        this._statsTimer += dt;
        if (this._statsTimer >= 1) {
            const ticks = Math.floor(this._statsTimer);
            this._statsTimer -= ticks;
            
            this.hunger = Math.max(0, this.hunger - ticks * 0.55);
            this.thirst = Math.max(0, this.thirst - ticks * 0.75);
            
            if (this.hunger <= 0 || this.thirst <= 0) {
                this.health = Math.max(0, this.health - ticks * 2);
            } else {
                this.health = Math.min(this.maxHealth, this.health + ticks * 0.25);
            }
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
    
    redraw() {
        this.shadow.clear();
        this.shadow.ellipse(3, 11, this.radius * 0.9, this.radius * 0.45, 0).fill({ color: 0x000000, alpha: 0.25 });
        
        this.body.clear();
        this.body.circle(0, 0, this.radius).fill({ color: 0x2d7ff9 });
        this.body.circle(0, 0, this.radius).stroke({ width: 4, color: 0x0b1220, alpha: 0.7 });
        this.body.circle(-5, -5, 6).fill({ color: 0xffffff, alpha: 0.12 });
        
        this.face.clear();
        this.face.circle(-6, -5, 3).fill({ color: 0xffffff });
        this.face.circle(6, -5, 3).fill({ color: 0xffffff });
        this.face.circle(-6, -5, 1.4).fill({ color: 0x0b1220 });
        this.face.circle(6, -5, 1.4).fill({ color: 0x0b1220 });
        this.face.roundRect(-5, 4, 10, 4, 2).stroke({ width: 2, color: 0xffffff, alpha: 0.9 });
    }
    
    gainXp(amount) {
        this.xp += amount;
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level += 1;
            this.xpToNext = Math.floor(this.xpToNext * 1.2);
            
            this.maxHealth += 8;
            this.health = this.maxHealth;
            this.attackDamage += 2;
            this.maxTamed = Math.min(10, 3 + Math.floor(this.level / 3));
            this.flash();
        }
    }
}
