import { Renderer } from './Renderer.js';
import { World } from './World.js';
import { Player } from '../entities/Player.js';
import { InputManager } from './InputManager.js';
import { UIManager } from '../ui/UIManager.js';
import { ResourceManager } from './ResourceManager.js';
import { AnimalManager } from './AnimalManager.js';
import { CraftingSystem } from './CraftingSystem.js';
import { NotificationManager } from '../ui/NotificationManager.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.world = new World();
        this.player = new Player(400, 300);
        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.resourceManager = new ResourceManager();
        this.animalManager = new AnimalManager();
        this.craftingSystem = new CraftingSystem();
        this.notificationManager = new NotificationManager();
        
        this.gameLoop = null;
        this.lastTime = 0;
        this.isRunning = false;
        
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1
        };
        
        this.setupCanvas();
    }
    
    async init() {
        await this.renderer.init();
        await this.world.init();
        await this.player.init();
        await this.animalManager.init();
        
        this.setupEventListeners();
        
        console.log('Game initialized successfully');
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    setupEventListeners() {
        // Input events
        this.inputManager.on('move', (direction) => {
            this.player.setMovement(direction);
        });
        
        this.inputManager.on('action', (action) => {
            this.handlePlayerAction(action);
        });
        
        this.inputManager.on('attack', () => {
            this.player.attack();
        });
        
        this.inputManager.on('tame', () => {
            this.handleTameAction();
        });
        
        this.inputManager.on('gather', () => {
            this.handleGatherAction();
        });
        
        // UI events
        this.uiManager.on('openInventory', () => {
            this.uiManager.showInventory();
        });
        
        this.uiManager.on('openCrafting', () => {
            this.uiManager.showCrafting();
        });
        
        this.uiManager.on('craft', (recipe) => {
            this.craftingSystem.craft(recipe, this.player);
        });
    }
    
    start() {
        this.canvas.classList.remove('hidden');
        document.getElementById('gameUI').classList.remove('hidden');
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
        
        this.notificationManager.show('Welcome to Wild Tamer!', 'success');
    }
    
    stop() {
        this.isRunning = false;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
    }
    
    update(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // Update game systems
        this.player.update(deltaTime);
        this.world.update(deltaTime);
        this.animalManager.update(deltaTime);
        this.updateCamera();
        
        // Check collisions
        this.checkCollisions();
        
        // Update UI
        this.uiManager.update(this.player);
        
        // Render everything
        this.render();
        
        this.gameLoop = requestAnimationFrame((time) => this.update(time));
    }
    
    updateCamera() {
        // Follow player with smooth camera
        const targetX = this.player.x - this.canvas.width / 2;
        const targetY = this.player.y - this.canvas.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
    }
    
    checkCollisions() {
        // Check player collision with resources
        const nearbyResources = this.world.getResourcesNear(this.player.x, this.player.y, 50);
        this.player.nearbyResources = nearbyResources;
        
        // Check player collision with animals
        const nearbyAnimals = this.animalManager.getAnimalsNear(this.player.x, this.player.y, 80);
        this.player.nearbyAnimals = nearbyAnimals;
        
        // Check animal AI and behaviors
        this.animalManager.updateBehaviors(this.player);
    }
    
    handlePlayerAction(action) {
        if (action.type === 'gather') {
            this.handleGatherAction();
        } else if (action.type === 'attack') {
            this.player.attack();
        }
    }
    
    handleTameAction() {
        const nearbyAnimals = this.player.nearbyAnimals || [];
        const tamableAnimal = nearbyAnimals.find(animal => 
            !animal.isTamed && animal.canBeTamed && 
            this.getDistance(this.player, animal) < 60
        );
        
        if (tamableAnimal) {
            const success = this.player.attemptTame(tamableAnimal);
            if (success) {
                this.animalManager.tameAnimal(tamableAnimal, this.player);
                this.notificationManager.show(`Tamed a ${tamableAnimal.type}!`, 'success');
            } else {
                this.notificationManager.show('Taming failed! Try again.', 'warning');
            }
        } else {
            this.notificationManager.show('No tamable animals nearby', 'warning');
        }
    }
    
    handleGatherAction() {
        const nearbyResources = this.player.nearbyResources || [];
        const resource = nearbyResources.find(r => 
            this.getDistance(this.player, r) < 50
        );
        
        if (resource) {
            const gathered = this.world.gatherResource(resource);
            if (gathered) {
                this.player.addResource(gathered.type, gathered.amount);
                this.notificationManager.show(`+${gathered.amount} ${gathered.type}`, 'success');
            }
        }
    }
    
    getDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for camera transform
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        
        // Render world
        this.world.render(this.ctx, this.camera);
        
        // Render animals
        this.animalManager.render(this.ctx, this.camera);
        
        // Render player
        this.player.render(this.ctx);
        
        // Restore context
        this.ctx.restore();
        
        // Render UI elements that don't move with camera
        this.renderMinimap();
    }
    
    renderMinimap() {
        const minimapCanvas = document.getElementById('minimapCanvas');
        const minimapCtx = minimapCanvas.getContext('2d');
        
        // Clear minimap
        minimapCtx.clearRect(0, 0, 120, 120);
        
        // Draw world bounds
        minimapCtx.fillStyle = '#2c5530';
        minimapCtx.fillRect(0, 0, 120, 120);
        
        // Draw player position
        const playerMapX = (this.player.x / this.world.width) * 120;
        const playerMapY = (this.player.y / this.world.height) * 120;
        
        minimapCtx.fillStyle = '#ff6b6b';
        minimapCtx.beginPath();
        minimapCtx.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2);
        minimapCtx.fill();
        
        // Draw tamed animals
        this.animalManager.animals.forEach(animal => {
            if (animal.isTamed) {
                const animalMapX = (animal.x / this.world.width) * 120;
                const animalMapY = (animal.y / this.world.height) * 120;
                
                minimapCtx.fillStyle = '#5f27cd';
                minimapCtx.beginPath();
                minimapCtx.arc(animalMapX, animalMapY, 2, 0, Math.PI * 2);
                minimapCtx.fill();
            }
        });
    }
}