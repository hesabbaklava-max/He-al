export class LoadingManager {
    constructor() {
        this.screen = document.getElementById('loadingScreen');
        this.progress = this.screen?.querySelector('.loading-progress') || null;
        this.text = this.screen?.querySelector('.loading-text') || null;
        this._animFrame = null;
    }
    
    async show() {
        if (!this.screen) return;
        
        this.screen.classList.remove('hidden');
        if (this.text) this.text.textContent = 'Loading amazing world...';
        
        if (!this.progress) return;
        
        this.progress.style.width = '0%';
        
        await new Promise((resolve) => {
            const start = performance.now();
            const durationMs = 800;
            
            const tick = (now) => {
                const t = Math.min(1, (now - start) / durationMs);
                this.progress.style.width = `${Math.round(t * 100)}%`;
                if (t >= 1) {
                    this._animFrame = null;
                    resolve();
                    return;
                }
                this._animFrame = requestAnimationFrame(tick);
            };
            
            this._animFrame = requestAnimationFrame(tick);
        });
    }
    
    hide() {
        if (this._animFrame) {
            cancelAnimationFrame(this._animFrame);
            this._animFrame = null;
        }
        if (!this.screen) return;
        this.screen.classList.add('hidden');
    }
}
