import { Application, Container, Graphics, Text } from 'pixi.js';
import { InputManager } from '../core/InputManager.js';
import { Player } from './runtime/player.js';
import { Animal } from './runtime/animal.js';
import { ResourceNode } from './runtime/resourceNode.js';
import { ParticleSystem } from './runtime/particles.js';

export class PixiGame {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.app = null;
        this.world = null;
        this.fx = null;
        this.hud = null;
        this.camera = null;
        
        this.input = null;
        this.player = null;
        
        this.animals = [];
        this.resources = [];
        this.particles = null;
        
        this.isRunning = false;
        this.worldWidth = 2400;
        this.worldHeight = 2400;
        
        this._camX = 0;
        this._camY = 0;
        this._shakeT = 0;
        this._shakeS = 0;
    }
    
    async init() {
        const canvas = document.getElementById('gameCanvas');
        
        this.app = new Application();
        await this.app.init({
            view: canvas,
            resizeTo: window,
            background: 0x0b1220,
            antialias: true,
            preference: 'canvas'
        });
        
        this.world = new Container();
        this.fx = new Container();
        this.camera = new Container();
        this.camera.addChild(this.world);
        this.camera.addChild(this.fx);
        this.app.stage.addChild(this.camera);
        
        this.setupBackground();
        this.setupInput();
        this.setupEntities();
        this.setupTicker();
        this.updateHud();
    }
    
    setupBackground() {
        const bg = new Graphics()
            .rect(0, 0, this.worldWidth, this.worldHeight)
            .fill({ color: 0x153b2b });
        
        const grid = new Graphics();
        const step = 120;
        for (let x = 0; x <= this.worldWidth; x += step) {
            grid.moveTo(x, 0).lineTo(x, this.worldHeight);
        }
        for (let y = 0; y <= this.worldHeight; y += step) {
            grid.moveTo(0, y).lineTo(this.worldWidth, y);
        }
        grid.stroke({ width: 2, color: 0x0b1220, alpha: 0.06 });
        
        const deco = new Graphics();
        for (let i = 0; i < 260; i++) {
            const x = Math.random() * this.worldWidth;
            const y = Math.random() * this.worldHeight;
            const r = 1 + Math.random() * 4;
            const a = 0.03 + Math.random() * 0.04;
            deco.circle(x, y, r).fill({ color: 0x0b1220, alpha: a });
        }
        
        const border = new Graphics()
            .rect(0, 0, this.worldWidth, this.worldHeight)
            .stroke({ width: 10, color: 0x0b1220, alpha: 0.35 });
        
        this.world.addChild(bg);
        this.world.addChild(grid);
        this.world.addChild(deco);
        this.world.addChild(border);
    }
    
    setupInput() {
        this.input = new InputManager();
        this.input.on('move', (dir) => {
            if (!this.player) return;
            this.player.setMoveDir(dir.x, dir.y);
        });
        this.input.on('attack', () => {
            if (!this.isRunning) return;
            this.attack();
        });
        this.input.on('tame', () => {
            if (!this.isRunning) return;
            this.tame();
        });
        this.input.on('gather', () => {
            if (!this.isRunning) return;
            this.gather();
        });
    }
    
    setupEntities() {
        this.player = new Player(400, 300);
        this.player.addTo(this.world);
        
        for (let i = 0; i < 14; i++) {
            const a = new Animal(
                200 + Math.random() * (this.worldWidth - 400),
                200 + Math.random() * (this.worldHeight - 400)
            );
            a.addTo(this.world);
            this.animals.push(a);
        }
        
        const types = ['wood', 'stone', 'berry'];
        for (let i = 0; i < 24; i++) {
            const t = types[i % types.length];
            const r = new ResourceNode(
                t,
                160 + Math.random() * (this.worldWidth - 320),
                160 + Math.random() * (this.worldHeight - 320)
            );
            r.addTo(this.world);
            this.resources.push(r);
        }
        
        this.particles = new ParticleSystem();
        this.particles.addTo(this.fx);
        
        this.hud = new Text({
            text: '',
            style: {
                fontFamily: 'Orbitron',
                fontSize: 12,
                fill: 0xffffff,
                align: 'left'
            }
        });
        this.hud.position.set(12, 12);
        this.app.stage.addChild(this.hud);
    }
    
    setupTicker() {
        this.app.ticker.add((ticker) => {
            if (!this.isRunning) return;
            const dt = ticker.deltaMS / 1000;
            this.update(dt);
        });
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.notificationManager.show('Wild Tamer: Pixi sürümü', 'success');
    }
    
    update(dt) {
        this.player.update(dt, this.worldWidth, this.worldHeight);
        
        for (const a of this.animals) {
            a.update(dt, this.player, this.worldWidth, this.worldHeight);
        }
        
        for (const r of this.resources) {
            r.update(dt);
        }
        
        this.particles.update(dt);
        
        this.updateCamera(dt);
        this.updateHud();
        this.updateDomUI();
    }
    
    updateCamera(dt) {
        const w = this.app.renderer.width;
        const h = this.app.renderer.height;
        const targetX = -this.player.x + w / 2;
        const targetY = -this.player.y + h / 2;
        
        const minX = -this.worldWidth + w;
        const minY = -this.worldHeight + h;
        
        const clampedX = Math.min(0, Math.max(minX, targetX));
        const clampedY = Math.min(0, Math.max(minY, targetY));
        
        this._camX += (clampedX - this._camX) * 0.12;
        this._camY += (clampedY - this._camY) * 0.12;
        
        let sx = 0;
        let sy = 0;
        if (this._shakeT > 0) {
            this._shakeT -= dt;
            const k = Math.max(0, this._shakeT) / 0.18;
            sx = (Math.random() * 2 - 1) * this._shakeS * k;
            sy = (Math.random() * 2 - 1) * this._shakeS * k;
        }
        
        this.camera.x = this._camX + sx;
        this.camera.y = this._camY + sy;
    }
    
    shake(strength = 10, duration = 0.18) {
        this._shakeS = Math.max(this._shakeS, strength);
        this._shakeT = Math.max(this._shakeT, duration);
    }
    
    updateHud() {
        if (!this.hud) return;
        this.hud.text =
            `Level ${this.player.level}  XP ${Math.floor(this.player.xp)}/${this.player.xpToNext}\n` +
            `Tamed ${this.animals.filter(a => a.isTamed).length}/${this.player.maxTamed}\n` +
            `Wood ${this.player.inventory.wood}  Stone ${this.player.inventory.stone}  Berry ${this.player.inventory.berry}`;
    }
    
    updateDomUI() {
        const healthBar = document.getElementById('healthBar');
        const hungerBar = document.getElementById('hungerBar');
        const thirstBar = document.getElementById('thirstBar');
        
        const healthText = document.getElementById('healthText');
        const hungerText = document.getElementById('hungerText');
        const thirstText = document.getElementById('thirstText');
        
        const woodCount = document.getElementById('woodCount');
        const stoneCount = document.getElementById('stoneCount');
        const meatCount = document.getElementById('meatCount');
        const berryCount = document.getElementById('berryCount');
        
        const hpPct = (this.player.health / this.player.maxHealth) * 100;
        const hungerPct = (this.player.hunger / this.player.maxHunger) * 100;
        const thirstPct = (this.player.thirst / this.player.maxThirst) * 100;
        
        healthBar.style.width = `${Math.max(0, Math.min(100, hpPct))}%`;
        hungerBar.style.width = `${Math.max(0, Math.min(100, hungerPct))}%`;
        thirstBar.style.width = `${Math.max(0, Math.min(100, thirstPct))}%`;
        
        healthText.textContent = `${Math.floor(this.player.health)}/${this.player.maxHealth}`;
        hungerText.textContent = `${Math.floor(this.player.hunger)}/${this.player.maxHunger}`;
        thirstText.textContent = `${Math.floor(this.player.thirst)}/${this.player.maxThirst}`;
        
        woodCount.textContent = this.player.inventory.wood;
        stoneCount.textContent = this.player.inventory.stone;
        meatCount.textContent = this.player.inventory.meat;
        berryCount.textContent = this.player.inventory.berry;
    }
    
    findNearestAnimal(range) {
        let nearest = null;
        let best = Infinity;
        for (const a of this.animals) {
            const dx = a.x - this.player.x;
            const dy = a.y - this.player.y;
            const d = Math.hypot(dx, dy);
            if (d <= range && d < best) {
                best = d;
                nearest = a;
            }
        }
        return nearest;
    }
    
    findNearestResource(range) {
        let nearest = null;
        let best = Infinity;
        for (const r of this.resources) {
            if (r.isDepleted) continue;
            const dx = r.x - this.player.x;
            const dy = r.y - this.player.y;
            const d = Math.hypot(dx, dy);
            if (d <= range && d < best) {
                best = d;
                nearest = r;
            }
        }
        return nearest;
    }
    
    attack() {
        const target = this.findNearestAnimal(this.player.attackRange);
        if (!target) {
            this.notificationManager.show('Menzilde hedef yok', 'warning');
            return;
        }
        if (target.isTamed) {
            this.notificationManager.show('Evcilleştirilmiş hedefe saldıramazsın', 'info');
            return;
        }
        this.player.flash();
        this.player.punch(-this.player.dir.x, -this.player.dir.y);
        
        const killed = target.takeDamage(this.player.attackDamage);
        this.player.gainXp(6);
        this.notificationManager.show('Saldırı!', 'combat', 1200);
        
        const dx = target.x - this.player.x;
        const dy = target.y - this.player.y;
        const d = Math.hypot(dx, dy) || 1;
        target.punch(dx / d, dy / d);
        this.particles.textBurst(target.x, target.y, { color: 0xfff1a6 });
        this.shake(10, 0.14);
        
        if (killed) {
            this.player.inventory.meat += 1;
            this.player.gainXp(18);
            this.notificationManager.show('Av: +1 meat', 'success', 1500);
            this.particles.burstCircle(target.x, target.y, { count: 18, color: 0xff4d4d, spread: 1, speed: 320, life: 0.55, size: 3 });
            this.shake(14, 0.18);
            target.respawn(this.worldWidth, this.worldHeight);
        }
    }
    
    tame() {
        const target = this.findNearestAnimal(this.player.tameRange);
        if (!target) {
            this.notificationManager.show('Yakında evcilleştirilecek hayvan yok', 'warning');
            return;
        }
        if (target.isTamed) {
            this.notificationManager.show('Bu hayvan zaten evcilleştirilmiş', 'info');
            return;
        }
        if (this.animals.filter(a => a.isTamed).length >= this.player.maxTamed) {
            this.notificationManager.show('Maksimum evcilleştirilmiş hayvan', 'warning');
            return;
        }
        
        const chance = Math.min(0.85, 0.25 + this.player.tamingSkill * 0.08);
        const ok = Math.random() < chance;
        if (!ok) {
            this.notificationManager.show('Evcilleştirme başarısız', 'warning');
            this.particles.burstCircle(target.x, target.y, { count: 10, color: 0xffb4b4, spread: 0.8, speed: 220, life: 0.45, size: 2 });
            this.player.gainXp(2);
            return;
        }
        
        target.tame(this.player);
        this.player.tamingSkill += 0.25;
        this.player.gainXp(24);
        this.notificationManager.show('Evcilleştirildi!', 'success');
        this.particles.burstCircle(target.x, target.y, { count: 16, color: 0xa78bfa, spread: 1, speed: 280, life: 0.55, size: 3 });
    }
    
    gather() {
        const target = this.findNearestResource(this.player.gatherRange);
        if (!target) {
            this.notificationManager.show('Yakında toplanacak kaynak yok', 'warning');
            return;
        }
        
        const got = target.gather();
        if (!got) return;
        
        this.player.inventory[got.type] += got.amount;
        this.player.gainXp(4);
        this.notificationManager.show(`+${got.amount} ${got.type}`, 'gather', 1200);
        const c = got.type === 'wood' ? 0x34d399 : got.type === 'stone' ? 0xe2e8f0 : 0xfb7185;
        this.particles.burstCircle(target.x, target.y, { count: 12, color: c, spread: 0.9, speed: 260, life: 0.5, size: 3 });
    }
}
