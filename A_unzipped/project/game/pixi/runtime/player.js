import { Graphics } from 'pixi.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
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
        
        this.gfx = new Graphics();
        this.gfx.circle(0, 0, this.radius).fill({ color: 0x2d7ff9 });
        this.gfx.circle(0, 0, this.radius).stroke({ width: 3, color: 0xffffff, alpha: 0.7 });
        this.gfx.position.set(this.x, this.y);
        
        this._statsTimer = 0;
    }
    
    addTo(container) {
        container.addChild(this.gfx);
    }
    
    setMoveDir(x, y) {
        this.vx = x * this.speed;
        this.vy = y * this.speed;
    }
    
    update(dt, worldWidth, worldHeight) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        const pad = 24;
        this.x = Math.max(pad, Math.min(worldWidth - pad, this.x));
        this.y = Math.max(pad, Math.min(worldHeight - pad, this.y));
        
        this.gfx.position.set(this.x, this.y);
        
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
        }
    }
}

