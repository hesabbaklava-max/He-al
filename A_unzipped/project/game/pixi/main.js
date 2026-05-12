import { LoadingManager } from '../ui/LoadingManager.js';
import { MenuManager } from '../ui/MenuManager.js';
import { NotificationManager } from '../ui/NotificationManager.js';
import { PixiGame } from './pixiGame.js';

class GameApp {
    constructor() {
        this.loadingManager = new LoadingManager();
        this.menuManager = new MenuManager();
        this.notificationManager = new NotificationManager();
        this.game = null;
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadingManager.show();
            
            this.game = new PixiGame(this.notificationManager);
            window.game = this.game;
            await this.game.init();
            
            this.loadingManager.hide();
            this.menuManager.show();
            this.setupMenuEvents();
        } catch (err) {
            this.loadingManager.hide();
            this.menuManager.show();
            console.error('Init failed:', err, err?.message, err?.stack);
            this.notificationManager.show('Başlatma hatası: konsolu kontrol et', 'error', 5000);
        }
    }
    
    setupMenuEvents() {
        const playBtn = document.getElementById('playBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const helpBtn = document.getElementById('helpBtn');
        
        playBtn.addEventListener('click', () => this.startGame());
        settingsBtn.addEventListener('click', () => this.notificationManager.show('Ayarlar henüz eklenmedi', 'info'));
        helpBtn.addEventListener('click', () => this.notificationManager.show('WASD: hareket • Space: saldırı • F: evcilleştir • E: topla', 'info', 5000));
    }
    
    startGame() {
        this.menuManager.hide();
        const canvas = document.getElementById('gameCanvas');
        canvas.classList.remove('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
        this.game.start();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('error', (e) => {
        console.error('Window error:', e?.message, e?.error?.stack || e?.error);
    });
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled rejection:', e?.reason, e?.reason?.message, e?.reason?.stack);
    });
    new GameApp();
});
