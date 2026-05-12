import { Application, Container, Graphics, Text } from 'pixi.js';
import { InputManager } from '../core/InputManager.js';
import { Player } from './runtime/player.js';
import { Animal } from './runtime/animal.js';
import { ResourceNode } from './runtime/resourceNode.js';

export class PixiGame {
    constructor(notificationManager) {
        this.notificationManager = notificationManager;
        this.app = null;
        this.world = null;
        this.hud = null;
        this.camera = null;
        
        this.input = null;
        this.player = null;
        
        this.animals = [];
        this.resources = [];
        
        this.isRunning = false;
        this.worldWidth = 2400;
        this.worldHeight = 2400;
    }
    
    async init() {
        const canvas = document.getElementById('gameCanvas');
        
        this.app = new Application();
        await this.app.init({
            view: canvas,
            resizeTo: window,
            background: 0x0b1220,
            antialias: true
        });
        
        this.world = new Container();
        this.camera = new Container();
        this.camera.addChild(this.world);
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
            .fill({ color: 0x163b2a });
        
        const border = new Graphics()
            .rect(0, 0, this.worldWidth, this.worldHeight)
            .stroke({ width: 6, color: 0x0b1220, alpha: 0.7 });
        
        this.world.addChild(bg);
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
        
        this.updateCamera();
        this.updateHud();
        this.updateDomUI();
    }
    
    updateCamera() {
        const w = this.app.renderer.width;
        const h = this.app.renderer.height;
        const targetX = -this.player.x + w / 2;
        const targetY = -this.player.y + h / 2;
        
        const minX = -this.worldWidth + w;
        const minY = -this.worldHeight + h;
        
        this.camera.x = Math.min(0, Math.max(minX, targetX));
        this.camera.y = Math.min(0, Math.max(minY, targetY));
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
        const killed = target.takeDamage(this.player.attackDamage);
        this.player.gainXp(6);
        this.notificationManager.show('Saldırı!', 'combat', 1200);
        
        if (killed) {
            this.player.inventory.meat += 1;
            this.player.gainXp(18);
            this.notificationManager.show('Av: +1 meat', 'success', 1500);
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
            this.player.gainXp(2);
            return;
        }
        
        target.tame(this.player);
        this.player.tamingSkill += 0.25;
        this.player.gainXp(24);
        this.notificationManager.show('Evcilleştirildi!', 'success');
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
    }
}

