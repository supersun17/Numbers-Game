class UIManager {
    constructor(game) {
        this.game = game;
        this.levelElement = document.getElementById('level');
        this.experienceElement = document.getElementById('experience');
        this.worldLevelElement = document.getElementById('world-level');
        this.skillPointsElement = document.getElementById('skill-points');
        this.skillInstructionElement = document.getElementById('skill-instruction');
        this.statsModal = document.getElementById('statsModal');
        this.closeStatsBtn = document.querySelector('.close-stats');
        this.totalExpElement = document.getElementById('total-exp');
        this.expFillElement = document.getElementById('exp-fill');

        this.damagePopups = [];
        this.levelUpPopup = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.closeStatsBtn.addEventListener('click', () => this.hideStats());
        window.addEventListener('click', (e) => {
            if (e.target === this.statsModal) this.hideStats();
        });

        // Skill point buttons
        document.getElementById('skill-attack').addEventListener('click', () => this.game.useSkillPoint('attackPower'));
        document.getElementById('skill-speed').addEventListener('click', () => this.game.useSkillPoint('attackSpeed'));
        document.getElementById('skill-range').addEventListener('click', () => this.game.useSkillPoint('attackRange'));
        document.getElementById('skill-crit-chance').addEventListener('click', () => this.game.useSkillPoint('criticalHitChance'));
        document.getElementById('skill-crit-damage').addEventListener('click', () => this.game.useSkillPoint('criticalHitDamage'));
    }

    updateHUD() {
        this.levelElement.textContent = this.game.level;
        this.experienceElement.textContent = this.game.experience;
        this.worldLevelElement.textContent = this.game.worldLevel;
        this.skillPointsElement.textContent = this.game.player.skillPoints;

        this.skillInstructionElement.style.display = this.game.player.skillPoints >= 1 ? 'inline' : 'none';

        const totalExpNeeded = 2;
        this.totalExpElement.textContent = totalExpNeeded;

        const expPercentage = (this.game.experience / totalExpNeeded) * 100;
        this.expFillElement.style.width = `${expPercentage}%`;
    }

    showDamagePopup(text, x, y, color, isCritical) {
        this.damagePopups.push({
            text, x, y, color, isCritical,
            opacity: 1,
            startTime: Date.now()
        });
    }

    showLevelUpPopup(benefitText, x, y) {
        this.levelUpPopup = {
            text: `Level Up! ${benefitText}`,
            x: x,
            y: y - 20,
            opacity: 1,
            startTime: Date.now()
        };
    }

    updatePopups() {
        if (this.levelUpPopup) {
            const elapsed = Date.now() - this.levelUpPopup.startTime;
            if (elapsed >= 2000) {
                this.levelUpPopup = null;
            } else {
                this.levelUpPopup.opacity = 1 - (elapsed / 2000);
                this.levelUpPopup.y -= 0.5;
            }
        }

        this.damagePopups = this.damagePopups.filter(popup => {
            const elapsed = Date.now() - popup.startTime;
            if (elapsed >= 1000) return false;
            popup.opacity = 1 - (elapsed / 1000);
            popup.y -= 1;
            return true;
        });
    }

    toggleStats() {
        if (this.statsModal.style.display === 'block') {
            this.hideStats();
        } else {
            this.showStats();
        }
    }

    showStats() {
        const stats = this.game.player.stats;
        document.getElementById('healthStat').textContent = `${stats.currentHealth}/${stats.totalHealth}`;
        document.getElementById('attackPowerStat').textContent = stats.attackPower;
        document.getElementById('attackSpeedStat').textContent = stats.attackSpeed.toFixed(1);
        document.getElementById('attackRangeStat').textContent = stats.attackRange;
        document.getElementById('critChanceStat').textContent = `${stats.criticalHitChance}%`;
        document.getElementById('critDamageStat').textContent = `${stats.criticalHitDamage}%`;

        document.getElementById('attackPowerGained').textContent = `+${stats.gainedAttackPower}`;
        document.getElementById('attackSpeedGained').textContent = `+${stats.gainedAttackSpeed.toFixed(1)}`;
        document.getElementById('attackRangeGained').textContent = `+${stats.gainedAttackRange}`;
        document.getElementById('critChanceGained').textContent = `+${stats.gainedCriticalChance}%`;
        document.getElementById('critDamageGained').textContent = `+${stats.gainedCriticalHitDamage}`;

        this.calculateAndDisplayDPS();

        const skillButtons = document.querySelectorAll('.skill-button');
        skillButtons.forEach(button => {
            const statType = button.id.replace('skill-', '');
            if (statType === 'crit-chance') {
                const currentCritChance = stats.criticalHitChance + stats.gainedCriticalChance;
                button.disabled = currentCritChance >= 100;
            }
            button.style.display = this.game.player.skillPoints > 0 ? 'inline-block' : 'none';
        });

        this.statsModal.style.display = 'block';
    }

    calculateAndDisplayDPS() {
        const stats = this.game.player.stats;
        const totalAttackPower = stats.attackPower + stats.gainedAttackPower;
        const totalAttackSpeed = stats.attackSpeed + stats.gainedAttackSpeed;
        const totalCritChance = stats.criticalHitChance + stats.gainedCriticalChance;
        const totalCritDamage = stats.criticalHitDamage + stats.gainedCriticalHitDamage;

        const baseDamage = totalAttackPower;
        const critMultiplier = totalCritDamage / 100;
        const avgDamage = baseDamage + (baseDamage * (totalCritChance / 100) * (critMultiplier - 1));
        const dps = avgDamage * totalAttackSpeed;

        document.getElementById('dpsStat').textContent = Math.round(dps);
    }

    hideStats() {
        this.statsModal.style.display = 'none';
    }

    showGameOver() {
        const gameCanvas = document.getElementById('gameCanvas');
        const canvasRect = gameCanvas.getBoundingClientRect();

        const overlay = document.createElement('div');
        overlay.id = 'gameOverOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: ${canvasRect.top}px;
            left: ${canvasRect.left}px;
            width: ${canvasRect.width}px;
            height: ${canvasRect.height}px;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const gameOverText = document.createElement('div');
        gameOverText.textContent = 'YOU DIED';
        gameOverText.style.cssText = `
            color: #FF0000;
            font-size: 120px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
            animation: pulse 1s infinite;
        `;

        overlay.appendChild(gameOverText);
        document.body.appendChild(overlay);
    }
}
