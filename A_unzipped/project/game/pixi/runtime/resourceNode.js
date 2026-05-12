import { Graphics } from 'pixi.js';

export class ResourceNode {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.amount = 3 + Math.floor(Math.random() * 3);
        this.isDepleted = false;
        
        this.radius = type === 'stone' ? 18 : 16;
        
        this.gfx = new Graphics();
        this.draw();
        this.gfx.position.set(this.x, this.y);
    }
    
    addTo(container) {
        container.addChild(this.gfx);
    }
    
    draw() {
        this.gfx.clear();
        const color = this.type === 'wood' ? 0x10b981 : this.type === 'stone' ? 0x94a3b8 : 0xe11d48;
        this.gfx.circle(0, 0, this.radius).fill({ color, alpha: this.isDepleted ? 0.2 : 1 });
        this.gfx.circle(0, 0, this.radius).stroke({ width: 3, color: 0x0b1220, alpha: 0.7 });
    }
    
    gather() {
        if (this.isDepleted) return null;
        this.amount -= 1;
        if (this.amount <= 0) {
            this.isDepleted = true;
            this.draw();
            return { type: this.type, amount: 1 };
        }
        return { type: this.type, amount: 1 };
    }
}

