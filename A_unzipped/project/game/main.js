import { Game } from './core/Game.js';
import { LoadingManager } from './ui/LoadingManager.js';
import { MenuManager } from './ui/MenuManager.js';

class GameApp {
    constructor() {
        this.game = null;
        this.loadingManager = new LoadingManager();
        this.menuManager = new MenuManager();
        
        this.init();
    }
    
    async init() {
        // Show loading screen
        await this.loadingManager.show();
        
        // Initialize game
        this.game = new Game();
        await this.game.init();
        
        // Hide loading screen and show menu
        this.loadingManager.hide();
        this.menuManager.show();
        
        // Setup menu events
        this.setupMenuEvents();
    }
    
    setupMenuEvents() {
        const playBtn = document.getElementById('playBtn');
        const settingsBtn = document.getElementById('settingsBtn');
        const helpBtn = document.getElementById('helpBtn');
        
        playBtn.addEventListener('click', () => {
            this.startGame();
        });
        
        settingsBtn.addEventListener('click', () => {
            this.showSettings();
        });
        
        helpBtn.addEventListener('click', () => {
            this.showHelp();
        });
    }
    
    startGame() {
        this.menuManager.hide();
        this.game.start();
    }
    
    showSettings() {
        // TODO: Implement settings
        console.log('Settings clicked');
    }
    
    showHelp() {
        // TODO: Implement help
        console.log('Help clicked');
    }
}

// Start the application
window.addEventListener('DOMContentLoaded', () => {
    new GameApp();
});