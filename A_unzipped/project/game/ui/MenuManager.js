export class MenuManager {
    constructor() {
        this.menu = document.getElementById('mainMenu');
    }
    
    show() {
        if (!this.menu) return;
        this.menu.classList.remove('hidden');
    }
    
    hide() {
        if (!this.menu) return;
        this.menu.classList.add('hidden');
    }
}
