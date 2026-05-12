import { Container, Graphics } from 'pixi.js';

export class ResourceNode {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.amount = 3 + Math.floor(Math.random() * 3);
        this.isDepleted = false;
        
        this.radius = type === 'stone' ? 18 : 16;
        
        this.root = new Container();
        this.shadow = new Graphics();
        this.body = new Graphics();
        this.detail = new Graphics();
        
        this.root.addChild(this.shadow);
        this.root.addChild(this.body);
        this.root.addChild(this.detail);
        
        this.root.position.set(this.x, this.y);
        
        this._shakeT = 0;
        this._animT = Math.random() * 10;
        
        this.redraw();
    }
    
    addTo(container) {
        container.addChild(this.root);
    }
    
    redraw() {
        const alpha = this.isDepleted ? 0.2 : 1;
        const base = this.type === 'wood' ? 0x10b981 : this.type === 'stone' ? 0x94a3b8 : 0xe11d48;
        
        this.shadow.clear();
        this.shadow.ellipse(2, 10, this.radius * 0.9, this.radius * 0.4, 0).fill({ color: 0x000000, alpha: 0.18 * alpha });
        
        this.body.clear();
        this.body.circle(0, 0, this.radius).fill({ color: base, alpha });
        this.body.circle(0, 0, this.radius).stroke({ width: 4, color: 0x0b1220, alpha: 0.7 * alpha });
        
        this.detail.clear();
        if (this.type === 'wood') {
            this.detail.roundRect(-6, -10, 12, 8, 4).fill({ color: 0xffffff, alpha: 0.12 * alpha });
            this.detail.roundRect(-2, -2, 4, 10, 2).fill({ color: 0x064e3b, alpha: 0.6 * alpha });
        } else if (this.type === 'stone') {
            this.detail.poly([-6, -2, -2, -10, 6, -5, 4, 6, -5, 8]).fill({ color: 0xffffff, alpha: 0.12 * alpha });
        } else {
            this.detail.circle(-5, -4, 4).fill({ color: 0xffffff, alpha: 0.12 * alpha });
            this.detail.circle(4, -1, 3).fill({ color: 0xffffff, alpha: 0.1 * alpha });
        }
    }
    
    gather() {
        if (this.isDepleted) return null;
        this.amount -= 1;
        this._shakeT = 0.18;
        if (this.amount <= 0) {
            this.isDepleted = true;
            this.redraw();
            return { type: this.type, amount: 1 };
        }
        return { type: this.type, amount: 1 };
    }
    
    update(dt) {
        this._animT += dt;
        let sx = 0;
        let sy = 0;
        if (this._shakeT > 0) {
            this._shakeT -= dt;
            const k = Math.max(0, this._shakeT) / 0.18;
            sx = (Math.random() * 2 - 1) * 5 * k;
            sy = (Math.random() * 2 - 1) * 5 * k;
        }
        const bob = Math.sin(this._animT * 4) * 1.5;
        this.root.position.set(this.x + sx, this.y + bob + sy);
    }
}
