import { EventEmitter } from '../utils/EventEmitter.js';

export class UIManager extends EventEmitter {
    constructor() {
        super();
        this.isInventoryOpen = false;
        this.isCraftingOpen = false;
        this.isBuildingOpen = false;
        this.selectedCraftingCategory = 'weapons';
        this.selectedRecipe = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Inventory button
        const inventoryBtn = document.getElementById('inventoryBtn');
        inventoryBtn.addEventListener('click', () => {
            this.toggleInventory();
        });
        
        // Crafting button
        const craftingBtn = document.getElementById('craftingBtn');
        craftingBtn.addEventListener('click', () => {
            this.toggleCrafting();
        });
        
        // Building button
        const buildingBtn = document.getElementById('buildingBtn');
        buildingBtn.addEventListener('click', () => {
            this.toggleBuilding();
        });
        
        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                    this.isInventoryOpen = false;
                    this.isCraftingOpen = false;
                    this.isBuildingOpen = false;
                }
            });
        });
        
        // Click outside modal to close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.add('hidden');
                this.isInventoryOpen = false;
                this.isCraftingOpen = false;
                this.isBuildingOpen = false;
            }
        });
    }
    
    update(player) {
        this.updateStats(player);
        this.updateResources(player);
        this.updateTamedAnimals(player);
        
        if (this.isInventoryOpen) {
            this.updateInventory(player);
        }
        
        if (this.isCraftingOpen) {
            this.updateCrafting(player);
        }
    }
    
    updateStats(player) {
        // Health
        const healthBar = document.getElementById('healthBar');
        const healthText = document.getElementById('healthText');
        const healthPercent = (player.health / player.maxHealth) * 100;
        
        healthBar.style.width = `${healthPercent}%`;
        healthText.textContent = `${Math.floor(player.health)}/${player.maxHealth}`;
        
        // Hunger
        const hungerBar = document.getElementById('hungerBar');
        const hungerText = document.getElementById('hungerText');
        const hungerPercent = (player.hunger / player.maxHunger) * 100;
        
        hungerBar.style.width = `${hungerPercent}%`;
        hungerText.textContent = `${Math.floor(player.hunger)}/${player.maxHunger}`;
        
        // Thirst
        const thirstBar = document.getElementById('thirstBar');
        const thirstText = document.getElementById('thirstText');
        const thirstPercent = (player.thirst / player.maxThirst) * 100;
        
        thirstBar.style.width = `${thirstPercent}%`;
        thirstText.textContent = `${Math.floor(player.thirst)}/${player.maxThirst}`;
    }
    
    updateResources(player) {
        document.getElementById('woodCount').textContent = player.inventory.wood;
        document.getElementById('stoneCount').textContent = player.inventory.stone;
        document.getElementById('meatCount').textContent = player.inventory.meat;
        document.getElementById('berryCount').textContent = player.inventory.berry;
    }
    
    updateTamedAnimals(player) {
        const tamedList = document.getElementById('tamedList');
        tamedList.innerHTML = '';
        
        if (player.tamedAnimals && player.tamedAnimals.length > 0) {
            player.tamedAnimals.forEach(animal => {
                if (animal.isAlive) {
                    const animalElement = document.createElement('div');
                    animalElement.className = 'tamed-animal';
                    
                    const icon = this.getAnimalIcon(animal.animalType);
                    const healthPercent = Math.floor((animal.health / animal.maxHealth) * 100);
                    const loyaltyPercent = Math.floor((animal.loyalty / animal.maxLoyalty) * 100);
                    
                    animalElement.innerHTML = `
                        <span class="tamed-animal-icon">${icon}</span>
                        <div class="tamed-animal-info">
                            <div class="tamed-animal-name">${this.capitalizeFirst(animal.animalType)}</div>
                            <div class="tamed-animal-stats">
                                <span class="health">❤️${healthPercent}%</span>
                                <span class="loyalty">♥${loyaltyPercent}%</span>
                            </div>
                        </div>
                    `;
                    
                    tamedList.appendChild(animalElement);
                }
            });
        } else {
            tamedList.innerHTML = '<div class="no-animals">No tamed animals</div>';
        }
    }
    
    getAnimalIcon(animalType) {
        const icons = {
            'wolf': '🐺',
            'bear': '🐻',
            'rabbit': '🐰',
            'deer': '🦌',
            'boar': '🐗'
        };
        return icons[animalType] || '🐾';
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    toggleInventory() {
        const modal = document.getElementById('inventoryModal');
        this.isInventoryOpen = !this.isInventoryOpen;
        
        if (this.isInventoryOpen) {
            modal.classList.remove('hidden');
            this.emit('openInventory');
        } else {
            modal.classList.add('hidden');
        }
    }
    
    toggleCrafting() {
        const modal = document.getElementById('craftingModal');
        this.isCraftingOpen = !this.isCraftingOpen;
        
        if (this.isCraftingOpen) {
            modal.classList.remove('hidden');
            this.emit('openCrafting');
        } else {
            modal.classList.add('hidden');
        }
    }
    
    toggleBuilding() {
        this.isBuildingOpen = !this.isBuildingOpen;
        // TODO: Implement building system
        console.log('Building system not yet implemented');
    }
    
    showInventory() {
        this.isInventoryOpen = true;
        document.getElementById('inventoryModal').classList.remove('hidden');
    }
    
    showCrafting() {
        this.isCraftingOpen = true;
        document.getElementById('craftingModal').classList.remove('hidden');
    }
    
    updateInventory(player) {
        const inventoryGrid = document.getElementById('inventoryGrid');
        inventoryGrid.innerHTML = '';
        
        // Create inventory slots
        const totalSlots = 30;
        const items = this.getInventoryItems(player);
        
        for (let i = 0; i < totalSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            
            if (items[i]) {
                slot.classList.add('occupied');
                slot.innerHTML = `
                    <span class="item-icon">${items[i].icon}</span>
                    <span class="item-count">${items[i].count}</span>
                `;
                
                // Add tooltip
                slot.title = `${items[i].name}\n${items[i].description || ''}`;
            }
            
            inventoryGrid.appendChild(slot);
        }
    }
    
    getInventoryItems(player) {
        const items = [];
        
        // Add resources
        Object.entries(player.inventory).forEach(([type, count]) => {
            if (count > 0) {
                items.push({
                    type: type,
                    name: this.capitalizeFirst(type),
                    icon: this.getResourceIcon(type),
                    count: count,
                    description: `${this.capitalizeFirst(type)} resource`
                });
            }
        });
        
        // Add equipment
        if (player.weapon) {
            items.push({
                type: 'weapon',
                name: player.weapon.name,
                icon: '⚔️',
                count: 1,
                description: `Damage: ${player.weapon.damage}\nDurability: ${player.weapon.durability}`
            });
        }
        
        if (player.armor) {
            items.push({
                type: 'armor',
                name: player.armor.name,
                icon: '🛡️',
                count: 1,
                description: `Protection: ${Math.floor(player.armor.protection * 100)}%\nDurability: ${player.armor.durability}`
            });
        }
        
        return items;
    }
    
    getResourceIcon(type) {
        const icons = {
            'wood': '🪵',
            'stone': '🪨',
            'meat': '🥩',
            'berry': '🍓',
            'hide': '🦌',
            'bone': '🦴'
        };
        return icons[type] || '📦';
    }
    
    updateCrafting(player) {
        this.updateCraftingCategories();
        this.updateRecipesList(player);
        this.updateCraftingPreview(player);
    }
    
    updateCraftingCategories() {
        const recipesList = document.getElementById('recipesList');
        
        // Add category tabs if not exists
        if (!recipesList.querySelector('.category-tabs')) {
            const categoryTabs = document.createElement('div');
            categoryTabs.className = 'category-tabs';
            
            const categories = ['weapons', 'armor', 'tools', 'consumables', 'structures'];
            categories.forEach(category => {
                const tab = document.createElement('button');
                tab.className = `category-tab ${category === this.selectedCraftingCategory ? 'active' : ''}`;
                tab.textContent = this.capitalizeFirst(category);
                tab.addEventListener('click', () => {
                    this.selectedCraftingCategory = category;
                    this.updateCraftingCategories();
                });
                categoryTabs.appendChild(tab);
            });
            
            recipesList.insertBefore(categoryTabs, recipesList.firstChild);
        }
    }
    
    updateRecipesList(player) {
        const recipesList = document.getElementById('recipesList');
        
        // Remove existing recipes (keep category tabs)
        const existingRecipes = recipesList.querySelectorAll('.recipe-item');
        existingRecipes.forEach(recipe => recipe.remove());
        
        // Get recipes for current category
        const craftingSystem = window.game?.craftingSystem;
        if (!craftingSystem) return;
        
        const recipes = craftingSystem.getRecipesByCategory(player, this.selectedCraftingCategory);
        
        recipes.forEach(recipe => {
            const recipeElement = document.createElement('div');
            recipeElement.className = `recipe-item ${recipe.canCraft ? 'craftable' : 'not-craftable'}`;
            
            if (this.selectedRecipe && this.selectedRecipe.id === recipe.id) {
                recipeElement.classList.add('selected');
            }
            
            const materialsText = Object.entries(recipe.materials)
                .map(([material, amount]) => {
                    const available = player.inventory[material] || 0;
                    const hasEnough = available >= amount;
                    return `<span class="${hasEnough ? 'has-material' : 'missing-material'}">${this.getResourceIcon(material)} ${amount}</span>`;
                })
                .join(' ');
            
            recipeElement.innerHTML = `
                <div class="recipe-name">${recipe.name}</div>
                <div class="recipe-description">${recipe.description}</div>
                <div class="recipe-materials">${materialsText}</div>
                <div class="recipe-level">Level ${recipe.unlockLevel}</div>
            `;
            
            recipeElement.addEventListener('click', () => {
                this.selectedRecipe = recipe;
                this.updateRecipesList(player);
                this.updateCraftingPreview(player);
            });
            
            recipesList.appendChild(recipeElement);
        });
    }
    
    updateCraftingPreview(player) {
        const craftingPreview = document.getElementById('craftingPreview');
        
        if (!this.selectedRecipe) {
            craftingPreview.innerHTML = '<p>Select a recipe to see details</p>';
            return;
        }
        
        const recipe = this.selectedRecipe;
        const canCraft = recipe.canCraft;
        
        craftingPreview.innerHTML = `
            <div class="preview-header">
                <h3>${recipe.name}</h3>
                <div class="recipe-level">Level ${recipe.unlockLevel}</div>
            </div>
            
            <div class="preview-description">
                ${recipe.description}
            </div>
            
            <div class="preview-materials">
                <h4>Required Materials:</h4>
                ${Object.entries(recipe.materials).map(([material, amount]) => {
                    const available = player.inventory[material] || 0;
                    const hasEnough = available >= amount;
                    return `
                        <div class="material-requirement ${hasEnough ? 'satisfied' : 'missing'}">
                            ${this.getResourceIcon(material)} ${material}: ${available}/${amount}
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="preview-result">
                <h4>Result:</h4>
                <div class="result-stats">
                    ${this.getResultStatsHTML(recipe.result)}
                </div>
            </div>
            
            <button class="craft-btn ${canCraft ? 'enabled' : 'disabled'}" 
                    ${canCraft ? '' : 'disabled'}>
                ${canCraft ? 'Craft' : 'Cannot Craft'}
            </button>
        `;
        
        // Add craft button event listener
        const craftBtn = craftingPreview.querySelector('.craft-btn');
        if (craftBtn && canCraft) {
            craftBtn.addEventListener('click', () => {
                this.emit('craft', recipe);
            });
        }
    }
    
    getResultStatsHTML(result) {
        const stats = [];
        
        if (result.damage) stats.push(`⚔️ Damage: ${result.damage}`);
        if (result.protection) stats.push(`🛡️ Protection: ${Math.floor(result.protection * 100)}%`);
        if (result.durability) stats.push(`🔧 Durability: ${result.durability}`);
        if (result.range) stats.push(`📏 Range: ${result.range}`);
        if (result.hungerRestore) stats.push(`🍖 Hunger: +${result.hungerRestore}`);
        if (result.healthRestore) stats.push(`❤️ Health: +${result.healthRestore}`);
        if (result.thirstRestore) stats.push(`💧 Thirst: +${result.thirstRestore}`);
        if (result.gatherBonus) stats.push(`⛏️ Gather Bonus: +${Math.floor((result.gatherBonus - 1) * 100)}%`);
        if (result.tamingBonus) stats.push(`🤝 Taming Bonus: +${Math.floor((result.tamingBonus - 1) * 100)}%`);
        
        return stats.length > 0 ? stats.join('<br>') : 'No special stats';
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const notificationsContainer = document.getElementById('notifications');
        notificationsContainer.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    updateLevelDisplay(player) {
        // Update level indicator in UI
        const levelElements = document.querySelectorAll('.player-level');
        levelElements.forEach(element => {
            element.textContent = player.level;
        });
        
        // Update experience bar if exists
        const expBar = document.querySelector('.experience-bar');
        if (expBar) {
            const expPercent = (player.experience / player.experienceToNext) * 100;
            expBar.style.width = `${expPercent}%`;
        }
    }
    
    showLevelUpEffect(player) {
        this.showNotification(`Level Up! You are now level ${player.level}!`, 'success');
        
        // Add screen flash effect
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 215, 0, 0.3);
            pointer-events: none;
            z-index: 9999;
            animation: flash 0.5s ease-out;
        `;
        
        document.body.appendChild(flash);
        
        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 500);
    }
    
    // Add CSS for flash animation
    addFlashAnimation() {
        if (!document.querySelector('#flash-animation-style')) {
            const style = document.createElement('style');
            style.id = 'flash-animation-style';
            style.textContent = `
                @keyframes flash {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}