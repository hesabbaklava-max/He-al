import { Container, Graphics } from 'pixi.js';

export class ParticleSystem {
    constructor() {
        this.container = new Container();
        this.particles = [];
    }
    
    addTo(container) {
        container.addChild(this.container);
    }
    
    burstCircle(x, y, options = {}) {
        const {
            count = 10,
            color = 0xffffff,
            spread = 1,
            speed = 260,
            life = 0.5,
            size = 2,
            alpha = 1
        } = options;
        
        for (let i = 0; i < count; i++) {
            const a = (Math.random() * Math.PI * 2);
            const s = speed * (0.55 + Math.random() * 0.45) * spread;
            const p = {
                x,
                y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                t: 0,
                life,
                g: new Graphics()
            };
            p.g.circle(0, 0, size * (0.7 + Math.random() * 0.6)).fill({ color, alpha });
            p.g.position.set(x, y);
            this.container.addChild(p.g);
            this.particles.push(p);
        }
    }
    
    textBurst(x, y, options = {}) {
        const {
            count = 6,
            color = 0xffffff
        } = options;
        this.burstCircle(x, y, { count, color, spread: 0.9, speed: 180, life: 0.6, size: 2 });
        this.burstCircle(x, y, { count: Math.max(4, Math.floor(count / 2)), color: 0x000000, spread: 0.6, speed: 120, life: 0.35, size: 2, alpha: 0.35 });
    }
    
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.t += dt;
            const k = Math.min(1, p.t / p.life);
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= (1 - 2.4 * dt);
            p.vy *= (1 - 2.4 * dt);
            p.vy += 380 * dt;
            
            p.g.position.set(p.x, p.y);
            p.g.alpha = 1 - k;
            
            if (p.t >= p.life) {
                if (p.g.parent) p.g.parent.removeChild(p.g);
                this.particles.splice(i, 1);
            }
        }
    }
}

