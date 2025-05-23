import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="game-container" [style.background-image]="'url(' + getBackgroundImage() + ')'">
      <div class="game-header">
        <h1>Sudoku Battle</h1>
        <div class="header-controls">
          <div class="theme-selection">
            <button class="theme-btn" (click)="openThemeModal()">
              <span>🎨</span> Choose Battle Theme
            </button>
          </div>

          <div class="difficulty-selection">
            <label>Difficulty:</label>
            <select [(ngModel)]="selectedDifficulty" (change)="onDifficultyChange()" class="difficulty-select">
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div class="controls">
            <button class="control-btn restart" (click)="restartGame()">
              <span>🔄</span> New Game
            </button>
            <button class="control-btn hint" (click)="getHint()">
              <span>💡</span> Hint
            </button>

          </div>
        </div>
      </div>

      <div class="game-board">
        <div class="battle-status">
          <div class="battle-title">Battle Status</div>
          <div class="heroes-section">
            <div class="section-title">Your Army</div>
            <div class="heroes">
              <span *ngFor="let hero of heroes" class="hero">{{ getHeroEmoji() }}</span>
            </div>
          </div>
          <div class="battle-image">
            <img [src]="getBattleImage()" alt="Battle Scene" class="battle-img">
          </div>
          <div class="enemies-section">
            <div class="section-title">Enemies</div>
            <div class="enemies">
              <span class="enemy-count">{{ getEnemyEmoji() }} × {{ enemyCount }}</span>
            </div>
          </div>
        </div>
    <div class="sudoku-grid">
          <div *ngIf="loading" class="loading-overlay">
            <div class="loading-spinner">⟳</div>
            <p>Loading new puzzle...</p>
          </div>
      <div *ngFor="let row of board; let i = index" class="row">
            <div *ngFor="let cell of row; let j = index" 
                 class="cell" 
                 [class.thick-right]="j === 2 || j === 5"
                 [class.thick-bottom]="i === 2 || i === 5"
                 [class.error]="hasError(i, j)"
                 [class.highlighted]="isHighlighted(i, j)"
                 [class.selected]="isSelected(i, j)"
                 (click)="selectCell(i, j)">
              <span class="cell-value">{{ cell || '' }}</span>
              <div class="notes-grid" *ngIf="!cell && getNotes(i, j).length > 0">
                <span *ngFor="let note of getNotes(i, j)" class="note">{{ note }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="number-panel">
          <div class="panel-header">
            <button class="mode-btn" [class.active]="!isNotesMode" (click)="setNumberMode()">
              Numbers
            </button>
            <button class="mode-btn" [class.active]="isNotesMode" (click)="setNotesMode()">
              Notes
            </button>
          </div>
          
          <div class="number-grid" *ngIf="!isNotesMode">
            <div class="number-item" *ngFor="let num of numbers" 
                 [class.valid]="isCorrectNumber(num)"
                 [class.invalid]="!isCorrectNumber(num)"
                 (click)="selectNumber(num)">
              {{ num }}
            </div>
            <div class="number-item clear" (click)="selectNumber(null)">Clear</div>
          </div>

          <div class="notes-panel" *ngIf="isNotesMode">
            <div class="note-item" *ngFor="let n of numbers" 
                 [class.active]="isNoteActive(n)"
                 (click)="toggleNote(n)">
              {{ n }}
            </div>
            <div class="note-item clear" (click)="clearNotes()">Clear Notes</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Game Over Modal -->
    <div class="modal-backdrop" *ngIf="gameOver" (click)="restartGame()">
      <div class="modal game-over-modal" (click)="$event.stopPropagation()">
        <div class="modal-image">
          <img [src]="getGameOverImage()" alt="Game Over" class="modal-img">
        </div>
        <h2>Defeat!</h2>
        <p>Your army has been defeated! Would you like to try again?</p>
        <button class="modal-btn" (click)="restartGame()">New Battle</button>
      </div>
    </div>

    <!-- Game Won Modal -->
    <div class="modal-backdrop" *ngIf="gameWon" (click)="restartGame()">
      <div class="modal game-won-modal" (click)="$event.stopPropagation()">
        <div class="modal-image">
          <img [src]="getGameWonImage()" alt="Victory" class="modal-img">
        </div>
        <h2>Victory!</h2>
        <p>Congratulations! You have defeated all enemies!</p>
        <button class="modal-btn victory" (click)="restartGame()">New Battle</button>
      </div>
    </div>

    <!-- Theme Selection Modal -->
    <div class="modal-backdrop" *ngIf="showThemeModal" (click)="closeThemeModal()">
      <div class="modal theme-modal" (click)="$event.stopPropagation()">
        <h2>Choose Your Battle Theme</h2>
        <div class="theme-options">
          <div class="theme-option" 
               [class.selected]="previewTheme === 'soldiers'"
               (click)="selectPreviewTheme('soldiers')">
            <div class="theme-preview">
              <img src="/zombie_battle/zombie_battle_1.jpeg" alt="Soldiers vs Zombies" class="theme-preview-img">
            </div>
            <h3>Soldiers vs Zombies</h3>
            <p>Epic battle between brave soldiers and zombie hordes</p>
          </div>
          
          <div class="theme-option" 
               [class.selected]="previewTheme === 'samurai'"
               (click)="selectPreviewTheme('samurai')">
            <div class="theme-preview">
              <img src="/ninja_battle/ninja_battle_1.jpeg" alt="Samurais vs Ninjas" class="theme-preview-img">
            </div>
            <h3>Samurais vs Ninjas</h3>
            <p>Ancient warriors clash in legendary combat</p>
          </div>
        </div>
        
        <div class="theme-modal-buttons">
          <button class="modal-btn cancel" (click)="closeThemeModal()">Cancel</button>
          <button class="modal-btn confirm" (click)="confirmThemeSelection()">Confirm Theme</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100vh;
      background-size: cover;
      background-position: center;
      background-attachment: fixed;
      background-repeat: no-repeat;
      padding: 0.5rem;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    .game-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 0;
    }

    .game-container > * {
      position: relative;
      z-index: 1;
    }

    .game-board {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }

    .game-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      background: rgba(255, 255, 255, 0.9);
      padding: 1rem;
      border-radius: 12px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    .header-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .difficulty-selection {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .difficulty-selection label {
      color: #2c3e50;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .difficulty-select {
      padding: 0.4rem 0.6rem;
      border: 2px solid #bdc3c7;
      border-radius: 6px;
      background: white;
      color: #2c3e50;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .difficulty-select:hover, .difficulty-select:focus {
      border-color: #3498db;
      outline: none;
    }

    .battle-status {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
      padding: 1.2rem;
      border-radius: 15px;
      box-shadow: 
        0 8px 25px rgba(0,0,0,0.25),
        inset 0 1px 0 rgba(255,255,255,0.9);
      min-width: 260px;
      max-width: 280px;
      border: 2px solid transparent;
      background-clip: padding-box;
      position: relative;
      overflow: hidden;
      backdrop-filter: blur(15px);
    }

    .battle-status::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, #3498db, #9b59b6, #e74c3c, #f39c12);
      border-radius: 20px;
      z-index: -1;
      margin: -3px;
    }

    .battle-title {
      font-size: 1rem;
      font-weight: 700;
      color: #2c3e50;
      text-align: center;
      margin-bottom: 0.3rem;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      background: linear-gradient(45deg, #3498db, #9b59b6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 0.5px;
    }

    .heroes-section, .enemies-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 10px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .section-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: #34495e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
      background: linear-gradient(45deg, #2c3e50, #34495e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .heroes {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(46, 204, 113, 0.1);
      border-radius: 12px;
      border: 2px solid rgba(46, 204, 113, 0.3);
    }

    .hero {
      font-size: 1.4rem;
      animation: heroStand 2s infinite ease-in-out;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.4));
      transition: all 0.3s ease;
    }

    .hero:hover {
      transform: scale(1.2) rotate(10deg);
      filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.5));
    }

    .battle-image {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.6rem;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 10px;
      border: 2px solid rgba(52, 152, 219, 0.3);
      backdrop-filter: blur(5px);
    }

    .battle-img {
      width: 280px;
      height: 180px;
      object-fit: cover;
      border-radius: 15px;
      box-shadow: 
        0 6px 20px rgba(0,0,0,0.4),
        inset 0 1px 0 rgba(255,255,255,0.3);
      transition: all 0.4s ease;
      border: 4px solid rgba(255, 255, 255, 0.9);
    }

    .battle-img:hover {
      transform: scale(1.05) rotate(1deg);
      box-shadow: 
        0 10px 30px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.4);
      border-color: #3498db;
    }

    .enemies {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.8rem;
      padding: 0.8rem;
      background: rgba(231, 76, 60, 0.1);
      border-radius: 12px;
      border: 2px solid rgba(231, 76, 60, 0.3);
    }

    .enemy-count {
      font-size: 1.1rem;
      font-weight: 700;
      color: #e74c3c;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
      background: linear-gradient(45deg, #e74c3c, #c0392b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: enemyPulse 1.5s infinite ease-in-out;
    }

    @keyframes heroStand {
      0%, 100% { 
        transform: translateY(0px) scale(1); 
      }
      50% { 
        transform: translateY(-4px) scale(1.05); 
      }
    }

    @keyframes enemyPulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 1;
      }
      50% { 
        transform: scale(1.1);
        opacity: 0.8;
      }
    }

    .theme-selection {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .theme-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #9b59b6;
      border-radius: 8px;
      background: linear-gradient(45deg, #9b59b6, #8e44ad);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .theme-btn:hover {
      background: linear-gradient(45deg, #8e44ad, #9b59b6);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
    }

    .theme-btn span {
      font-size: 1rem;
    }

    .controls {
      display: flex;
      gap: 0.5rem;
    }

    .control-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: all 0.2s ease;
    }

    .control-btn span {
      font-size: 1rem;
    }

    .restart {
      background: #3498db;
      color: white;
    }

    .hint {
      background: #2ecc71;
      color: white;
    }



    .control-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    h1 {
      color: #2c3e50;
      font-size: 1.4rem;
      margin: 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .sudoku-grid {
      display: grid;
      grid-template-columns: repeat(9, 1fr);
      gap: 1px;
      background-color: #34495e;
      padding: 2px;
      border: 3px solid #2c3e50;
      border-radius: 8px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.3);
      width: 360px;
      position: relative;
      backdrop-filter: blur(5px);
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: 4px;
    }

    .loading-spinner {
      font-size: 2rem;
      animation: spin 1s linear infinite;
      margin-bottom: 0.5rem;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .row {
      display: contents;
    }

    .cell {
      background-color: white;
      padding: 0;
      text-align: center;
      cursor: pointer;
      width: 40px;
      height: 40px;
      font-size: 1.2rem;
      font-weight: 500;
      color: #2c3e50;
      border: 1px solid #bdc3c7;
      user-select: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
    }

    .cell-value {
      font-size: 1.2rem;
      z-index: 2;
    }

    .notes-grid {
      position: absolute;
      top: 3px;
      left: 3px;
      right: 3px;
      bottom: 3px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 2px;
      z-index: 1;
    }

    .note {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(52, 152, 219, 0.1);
      border: 1px solid rgba(52, 152, 219, 0.3);
      border-radius: 3px;
      font-size: 0.65rem;
      font-weight: 700;
      color: #2980b9;
      min-height: 8px;
      transition: all 0.2s ease;
    }

    .note:hover {
      background: rgba(52, 152, 219, 0.2);
      border-color: rgba(52, 152, 219, 0.5);
    }

    .cell.error {
      background-color: #ffebee;
      color: #e74c3c;
    }

    .cell.highlighted {
      background-color: #fff3cd;
      border-color: #f39c12;
      animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .cell:hover {
      background: #e8f4f8;
      transform: scale(1.02);
    }

    .cell.selected {
      background: #d4edda;
      border-color: #28a745;
      box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
    }

    .thick-right {
      border-right: 2px solid #2c3e50;
    }

    .thick-bottom {
      border-bottom: 2px solid #2c3e50;
    }

    .popup-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .popup {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      padding: 16px;
      width: 280px;
      animation: popupFadeIn 0.2s ease;
    }

    .popup-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .popup-buttons {
      display: flex;
      gap: 8px;
    }

    .popup-btn {
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      transition: all 0.2s ease;
    }

    .possibilities-btn {
      background: #3498db;
      color: white;
    }

    .notes-btn {
      background: #95a5a6;
      color: white;
    }

    .notes-btn.active {
      background: #2c3e50;
    }

    .cancel-btn {
      background: #e74c3c;
      color: white;
      width: 24px;
      height: 24px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .popup-btn:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .popup-content {
      min-height: 200px;
    }

    .number-options, .notes-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .possibilities-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .possibility-item {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 500;
      color: #2c3e50;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .possibility-item:hover {
      background: #e8f4f8;
      border-color: #3498db;
      transform: translateY(-2px);
    }

    .possibility-item.valid {
      background: white;
      border-color: #2ecc71;
      color: #2c3e50;
    }

    .possibility-item.invalid {
      background: #f8f9fa;
      border-color: #e9ecef;
      color: #95a5a6;
      opacity: 0.6;
    }

    .possibility-item.invalid:hover {
      background: #f8f9fa;
      border-color: #e9ecef;
      transform: none;
      cursor: not-allowed;
    }

    .number-option {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 500;
      color: #2c3e50;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .number-option:hover {
      background: #e8f4f8;
      border-color: #3498db;
      transform: translateY(-2px);
    }

    .number-option.active {
      background: #3498db;
      color: white;
      border-color: #2980b9;
    }

    .number-option.valid {
      background: #f8f9fa;
      border-color: #2ecc71;
    }

    .number-option.invalid {
      background: #fff5f5;
      border-color: #e74c3c;
      color: #95a5a6;
      opacity: 0.6;
    }

    .number-option.clear {
      grid-column: span 3;
      background: #fff5f5;
      color: #e74c3c;
      border-color: #fad7d7;
      font-weight: 600;
      height: 32px;
    }

    .number-option.clear:hover {
      background: #ffe3e3;
      border-color: #e74c3c;
          }

      .number-panel {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 15px;
        padding: 1rem;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        width: 200px;
        backdrop-filter: blur(10px);
        border: 2px solid rgba(255, 255, 255, 0.3);
      }

      .panel-header {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .mode-btn {
        flex: 1;
        padding: 0.5rem;
        border: 2px solid #e9ecef;
        border-radius: 6px;
        background: #f8f9fa;
        color: #2c3e50;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .mode-btn.active {
        background: #3498db;
        color: white;
        border-color: #2980b9;
      }

      .mode-btn:hover {
        transform: translateY(-1px);
      }

      .number-grid, .notes-panel {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
      }

      .number-item, .note-item {
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1.2rem;
        font-weight: 500;
        color: #2c3e50;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .number-item:hover, .note-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      }

      .number-item.valid {
        background: #d4edda;
        border-color: #28a745;
        color: #155724;
      }

      .number-item.invalid {
        background: #f8d7da;
        border-color: #dc3545;
        color: #721c24;
        opacity: 0.7;
      }

      .note-item.active {
        background: #3498db;
        color: white;
        border-color: #2980b9;
      }

      .number-item.clear, .note-item.clear {
        grid-column: span 3;
        background: #fff3cd;
        border-color: #ffeaa7;
        color: #856404;
        height: 40px;
      }
  
      .modal-backdrop {
      position: fixed !important;
      top: 0 !important; 
      left: 0 !important; 
      right: 0 !important; 
      bottom: 0 !important;
      background: rgba(0,0,0,0.85) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 999999 !important;
      backdrop-filter: blur(8px) !important;
      pointer-events: auto !important;
    }

    .modal {
      background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%) !important;
      padding: 2rem !important;
      border-radius: 20px !important;
      text-align: center !important;
      max-width: 400px !important;
      animation: modalFadeIn 0.3s ease !important;
      box-shadow: 
        0 25px 80px rgba(0,0,0,0.6) !important,
        inset 0 1px 0 rgba(255,255,255,0.8) !important;
      border: 4px solid rgba(255,255,255,0.9) !important;
      background-clip: padding-box !important;
      position: relative !important;
      overflow: hidden !important;
      z-index: 1000000 !important;
      pointer-events: auto !important;
    }

    .modal::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, #3498db, #9b59b6, #e74c3c, #f39c12);
      border-radius: 20px;
      z-index: -1;
      margin: -3px;
    }

    .modal-image {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .modal-img {
      width: 300px;
      height: 200px;
      object-fit: cover;
      border-radius: 15px;
      box-shadow: 
        0 8px 24px rgba(0,0,0,0.4),
        inset 0 1px 0 rgba(255,255,255,0.2);
      border: 3px solid rgba(255, 255, 255, 0.8);
      animation: modalImagePulse 2s infinite ease-in-out;
    }

    .game-over-modal {
      z-index: 1000002 !important;
    }

    .game-won-modal {
      z-index: 1000002 !important;
    }

    .game-over-modal h2 {
      color: #e74c3c;
      margin-bottom: 1rem;
      font-size: 2rem;
      font-weight: 800;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      background: linear-gradient(45deg, #e74c3c, #c0392b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .game-won-modal h2 {
      color: #2ecc71;
      margin-bottom: 1rem;
      font-size: 2rem;
      font-weight: 800;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      background: linear-gradient(45deg, #2ecc71, #27ae60);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .modal p {
      font-size: 1.1rem;
      color: #2c3e50;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }

    .modal-btn {
      background: linear-gradient(45deg, #3498db, #2980b9);
      color: white;
      border: none;
      padding: 1rem 2.5rem;
      border-radius: 12px;
      font-size: 1.2rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 1rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .modal-btn:hover {
      background: linear-gradient(45deg, #2980b9, #3498db);
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(52, 152, 219, 0.6);
    }

    .modal-btn.victory {
      background: linear-gradient(45deg, #2ecc71, #27ae60);
      box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4);
    }

    .modal-btn.victory:hover {
      background: linear-gradient(45deg, #27ae60, #2ecc71);
      box-shadow: 0 6px 20px rgba(46, 204, 113, 0.6);
    }

    @keyframes modalImagePulse {
      0%, 100% { 
        transform: scale(1);
        box-shadow: 
          0 8px 24px rgba(0,0,0,0.4),
          inset 0 1px 0 rgba(255,255,255,0.2);
      }
      50% { 
        transform: scale(1.02);
        box-shadow: 
          0 12px 32px rgba(0,0,0,0.5),
          inset 0 1px 0 rgba(255,255,255,0.3);
      }
    }

    .theme-modal {
      max-width: 600px !important;
      width: 90vw !important;
      z-index: 1000001 !important;
    }

    .theme-modal h2 {
      color: #2c3e50 !important;
      margin-bottom: 2rem !important;
      font-size: 1.8rem !important;
      font-weight: 800 !important;
      text-align: center !important;
      background: linear-gradient(45deg, #9b59b6, #3498db) !important;
      -webkit-background-clip: text !important;
      -webkit-text-fill-color: transparent !important;
      background-clip: text !important;
    }

    .theme-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .theme-option {
      background: rgba(255, 255, 255, 0.8);
      border: 3px solid transparent;
      border-radius: 15px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      backdrop-filter: blur(10px);
    }

    .theme-option:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    }

    .theme-option.selected {
      border-color: #3498db;
      background: rgba(52, 152, 219, 0.1);
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
    }

    .theme-preview {
      margin-bottom: 1rem;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .theme-preview-img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      transition: all 0.3s ease;
    }

    .theme-option:hover .theme-preview-img {
      transform: scale(1.05);
    }

    .theme-option h3 {
      color: #2c3e50;
      margin: 1rem 0 0.5rem 0;
      font-size: 1.2rem;
      font-weight: 700;
    }

    .theme-option p {
      color: #7f8c8d;
      font-size: 0.9rem;
      line-height: 1.4;
      margin: 0;
    }

    .theme-option.selected h3 {
      color: #3498db;
    }

    .theme-option.selected p {
      color: #2980b9;
    }

    .theme-modal-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .modal-btn.cancel {
      background: linear-gradient(45deg, #95a5a6, #7f8c8d);
      box-shadow: 0 4px 15px rgba(149, 165, 166, 0.4);
    }

    .modal-btn.cancel:hover {
      background: linear-gradient(45deg, #7f8c8d, #95a5a6);
      box-shadow: 0 6px 20px rgba(149, 165, 166, 0.6);
    }

    .modal-btn.confirm {
      background: linear-gradient(45deg, #9b59b6, #8e44ad);
      box-shadow: 0 4px 15px rgba(155, 89, 182, 0.4);
    }

    .modal-btn.confirm:hover {
      background: linear-gradient(45deg, #8e44ad, #9b59b6);
      box-shadow: 0 6px 20px rgba(155, 89, 182, 0.6);
    }

    @keyframes popupFadeIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'sudoku-angular';
  board: (number | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
  solution: (number | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  heroes = Array(3).fill('🪖');
  gameOver = false;
  errorCells: Set<string> = new Set();
  highlightedCells: Set<string> = new Set();
  showPossibilities = false;
  isNotesMode = false;
  notes: Map<string, Set<number>> = new Map();
  selectedDifficulty = 'Medium';
  selectedTheme = 'soldiers';
  loading = false;
  enemyCount = 0;

  selectedCell: { row: number, col: number } | null = null;
  lastMoveCorrect: boolean | null = null;
  gameWon = false;

  // Theme selection
  showThemeModal = false;
  previewTheme = 'soldiers';

  // Audio elements
  private winAudio: HTMLAudioElement | null = null;
  private loseAudio: HTMLAudioElement | null = null;
  private correctMoveAudio: HTMLAudioElement | null = null;
  private wrongMoveAudio: HTMLAudioElement | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadNewGame();
    this.initializeAudio();
  }

  getHeroEmoji(): string {
    return this.selectedTheme === 'soldiers' ? '🪖' : '🥷';
  }

  getEnemyEmoji(): string {
    return this.selectedTheme === 'soldiers' ? '🧟' : '🥷';
  }

  getBattleImage(): string {
    if (this.selectedTheme === 'samurai') {
      // Ninja battle images for samurai vs ninja theme
      // Last move was wrong
      if (this.lastMoveCorrect === false) {
        return '/ninja_battle/ninja_battle_4.jpeg';
      }

      // Last move was correct
      if (this.lastMoveCorrect === true) {
        return '/ninja_battle/ninja_battle_3.jpeg';
      }

      // Cell is selected, preparing to insert number
      if (this.selectedCell) {
        return '/ninja_battle/ninja_battle_2.jpeg';
      }

      // Default state - no cell selected
      return '/ninja_battle/ninja_battle_1.jpeg';
    } else {
      // Zombie battle images for soldiers theme
      // Last move was wrong
      if (this.lastMoveCorrect === false) {
        return '/zombie_battle/zombie_battle_4.jpeg';
      }

      // Last move was correct
      if (this.lastMoveCorrect === true) {
        return '/zombie_battle/zombie_battle_3.jpeg';
      }

      // Cell is selected, preparing to insert number
      if (this.selectedCell) {
        return '/zombie_battle/zombie_battle_2.jpeg';
      }

      // Default state - no cell selected
      return '/zombie_battle/zombie_battle_1.jpeg';
    }
  }

  getGameOverImage(): string {
    return this.selectedTheme === 'samurai' 
      ? '/ninja_battle/ninja_battle_6.jpeg'
      : '/zombie_battle/zombie_battle_6.jpeg';
  }

  getGameWonImage(): string {
    return this.selectedTheme === 'samurai' 
      ? '/ninja_battle/ninja_battle_5.jpeg'
      : '/zombie_battle/zombie_battle_5.jpeg';
  }

  getBackgroundImage(): string {
    return this.selectedTheme === 'samurai' 
      ? '/ninja_battle/bacground.jpeg'
      : '/zombie_battle/background.jpeg';
  }

  initializeAudio() {
    this.loadAudioFiles();
  }

  loadAudioFiles() {
    try {
      // Check if Audio is available (browser environment)
      if (typeof Audio !== 'undefined') {
        if (this.selectedTheme === 'samurai') {
          this.winAudio = new Audio('/ninja_battle/ninja_victory.mp3');
          this.loseAudio = new Audio('/ninja_battle/ninja_defeat.mp3');
          this.correctMoveAudio = new Audio('/ninja_battle/one_soldier_wont.mp3');
          this.wrongMoveAudio = new Audio('/ninja_battle/one_zombie_won.mp3');
        } else {
          this.winAudio = new Audio('/zombie_battle/zombie_defeat.mp3');
          this.loseAudio = new Audio('/zombie_battle/zombie_victory.mp3');
          this.correctMoveAudio = new Audio('/zombie_battle/one_soldier_won.mp3');
          this.wrongMoveAudio = new Audio('/zombie_battle/one_zombie_won.mp3');
        }

        // Preload audio files
        const audioFiles = [this.winAudio, this.loseAudio, this.correctMoveAudio, this.wrongMoveAudio];
        audioFiles.forEach(audio => {
          if (audio) {
            audio.preload = 'auto';
            audio.volume = 0.7;
          }
        });
      } else {
        console.warn('Audio not available in this environment');
      }
    } catch (error) {
      console.warn('Audio files could not be loaded:', error);
    }
  }

  stopAllAudio() {
    try {
      const audioFiles = [this.winAudio, this.loseAudio, this.correctMoveAudio, this.wrongMoveAudio];
      audioFiles.forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    } catch (error) {
      console.warn('Error stopping audio:', error);
    }
  }

  playWinSound() {
    try {
      this.stopAllAudio(); // Stop any currently playing audio
      if (this.winAudio) {
        this.winAudio.currentTime = 0; // Reset to beginning
        this.winAudio.play().catch(e => console.warn('Could not play win sound:', e));
      }
    } catch (error) {
      console.warn('Error playing win sound:', error);
    }
  }

  playLoseSound() {
    try {
      this.stopAllAudio(); // Stop any currently playing audio
      if (this.loseAudio) {
        this.loseAudio.currentTime = 0; // Reset to beginning
        this.loseAudio.play().catch(e => console.warn('Could not play lose sound:', e));
      }
    } catch (error) {
      console.warn('Error playing lose sound:', error);
    }
  }

  playCorrectMoveSound() {
    try {
      this.stopAllAudio(); // Stop any currently playing audio
      if (this.correctMoveAudio) {
        this.correctMoveAudio.currentTime = 0; // Reset to beginning
        this.correctMoveAudio.play().catch(e => console.warn('Could not play correct move sound:', e));
      }
    } catch (error) {
      console.warn('Error playing correct move sound:', error);
    }
  }

  playWrongMoveSound() {
    try {
      this.stopAllAudio(); // Stop any currently playing audio
      if (this.wrongMoveAudio) {
        this.wrongMoveAudio.currentTime = 0; // Reset to beginning
        this.wrongMoveAudio.play().catch(e => console.warn('Could not play wrong move sound:', e));
      }
    } catch (error) {
      console.warn('Error playing wrong move sound:', error);
    }
  }

  onThemeChange() {
    // Update heroes based on theme
    this.heroes = Array(3).fill(this.getHeroEmoji());
    // Reload audio files for new theme
    this.loadAudioFiles();
  }

  openThemeModal() {
    this.previewTheme = this.selectedTheme; // Set preview to current theme
    this.showThemeModal = true;
  }

  closeThemeModal() {
    this.showThemeModal = false;
  }

  selectPreviewTheme(theme: string) {
    this.previewTheme = theme;
  }

  confirmThemeSelection() {
    this.selectedTheme = this.previewTheme;
    this.showThemeModal = false;
    this.onThemeChange(); // Apply the theme changes
  }

  updateEnemyCount() {
    this.enemyCount = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this.board[i][j] === null) {
          this.enemyCount++;
        }
      }
    }
    
    // Check if game is won
    if (this.enemyCount === 0) {
      this.gameWon = true;
      this.playWinSound();
    }
  }

  onDifficultyChange() {
    this.loadNewGame();
  }

  selectCell(row: number, col: number) {
    if (this.gameOver) return;
    this.selectedCell = { row, col };
    this.clearHighlights();
  }

  isSelected(row: number, col: number): boolean {
    return this.selectedCell?.row === row && this.selectedCell?.col === col;
  }

  setNumberMode() {
    this.isNotesMode = false;
  }

  setNotesMode() {
    this.isNotesMode = true;
  }

  isCorrectNumber(num: number): boolean {
    if (!this.selectedCell) return false;
    const { row, col } = this.selectedCell;
    return this.isValidMove(row, col, num);
  }

  async loadNewGame() {
    this.loading = true;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const response = await this.http.get<any>(`https://sudoku-api.vercel.app/api/dosuku?query={newboard(limit:1){grids{value,solution,difficulty}}}`).toPromise();
        
        if (response && response.newboard && response.newboard.grids && response.newboard.grids.length > 0) {
          const grid = response.newboard.grids[0];
          const testBoard = this.convertGrid(grid.value);
          const emptyCells = this.countEmptyCells(testBoard);
          
          // Check if the puzzle matches our difficulty requirements
          if (this.isCorrectDifficulty(emptyCells)) {
            this.board = testBoard;
            this.solution = this.convertGrid(grid.solution);
            break;
          }
        }
        attempts++;
      } catch (error) {
        console.error('Failed to load puzzle from API, attempt', attempts + 1, error);
        attempts++;
      }
    }
    
    // If we couldn't find a suitable puzzle, use the last one we got
    if (attempts >= maxAttempts && (!this.board || this.board.every(row => row.every(cell => cell === null)))) {
      console.warn('Could not find puzzle matching difficulty requirements, using fallback');
      this.board = Array(9).fill(null).map(() => Array(9).fill(null));
      this.solution = Array(9).fill(null).map(() => Array(9).fill(null));
    }
    
    this.loading = false;
    this.gameWon = false;
    this.lastMoveCorrect = null;
    this.updateEnemyCount();
  }

  countEmptyCells(board: (number | null)[][]): number {
    let count = 0;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === null) {
          count++;
        }
      }
    }
    return count;
  }

  isCorrectDifficulty(emptyCells: number): boolean {
    switch (this.selectedDifficulty) {
      case 'Easy':
        return emptyCells >= 36 && emptyCells <= 41;
      case 'Medium':
        return emptyCells >= 42 && emptyCells <= 49;
      case 'Hard':
        return emptyCells >= 50 && emptyCells <= 58;
      default:
        return true;
    }
  }

  convertGrid(grid: number[][]): (number | null)[][] {
    return grid.map(row => 
      row.map(cell => cell === 0 ? null : cell)
    );
  }



  toggleNotesMode() {
    this.isNotesMode = !this.isNotesMode;
    this.showPossibilities = false;
  }

  getNotes(row: number, col: number): number[] {
    const key = `${row}-${col}`;
    return this.notes.has(key) ? Array.from(this.notes.get(key)!).sort() : [];
  }

  isNoteActive(num: number): boolean {
    if (!this.selectedCell) return false;
    const key = `${this.selectedCell.row}-${this.selectedCell.col}`;
    return this.notes.has(key) && this.notes.get(key)!.has(num);
  }

  toggleNote(num: number) {
    if (!this.selectedCell) return;
    const key = `${this.selectedCell.row}-${this.selectedCell.col}`;
    
    if (!this.notes.has(key)) {
      this.notes.set(key, new Set());
    }
    
    const cellNotes = this.notes.get(key)!;
    if (cellNotes.has(num)) {
      cellNotes.delete(num);
      if (cellNotes.size === 0) {
        this.notes.delete(key);
      }
    } else {
      cellNotes.add(num);
    }
  }

  clearNotes() {
    if (!this.selectedCell) return;
    const key = `${this.selectedCell.row}-${this.selectedCell.col}`;
    this.notes.delete(key);
  }

  getPossibilities(row: number, col: number): number[] {
    const possibilities: number[] = [];
    for (let num = 1; num <= 9; num++) {
      if (this.isValidMove(row, col, num)) {
        possibilities.push(num);
      }
    }
    return possibilities;
  }

  selectNumber(n: number | null) {
    if (this.selectedCell) {
      const { row, col } = this.selectedCell;
      
      // Clear notes when a number is selected
      const key = `${row}-${col}`;
      this.notes.delete(key);
      
      if (n !== null) {
        // Compare with API solution instead of Sudoku rules
        const correctNumber = this.solution && this.solution[row] && this.solution[row][col];
        
        if (correctNumber && n !== correctNumber) {
          // IMMEDIATE REACTION TO FAILURE - Wrong number compared to solution
          this.lastMoveCorrect = false;
          this.heroes.pop();
          this.errorCells.add(`${row}-${col}`);
          
          // Play wrong move sound only for first 2 mistakes (when heroes.length > 0)
          if (this.heroes.length > 0) {
            this.playWrongMoveSound();
          }
          
          // Place the wrong number to show the error
          this.board[row][col] = n;
          
          // Add shake animation to the cell
          this.highlightedCells.add(`${row}-${col}`);
          
          // Remove the highlight after animation
          setTimeout(() => {
            this.highlightedCells.delete(`${row}-${col}`);
            // Reset move status after showing wrong move image
            setTimeout(() => {
              this.lastMoveCorrect = null;
            }, 2000);
          }, 1000);
          
          if (this.heroes.length === 0) {
            this.gameOver = true;
            // Only play defeat sound on 3rd mistake (game over)
            this.playLoseSound();
          }
        } else {
          // Correct number or no solution available
          this.lastMoveCorrect = true;
          this.board[row][col] = n;
          this.errorCells.delete(`${row}-${col}`);
          
          // Play correct move sound
          this.playCorrectMoveSound();
          
          // Update enemy count (defeat an enemy!)
          this.updateEnemyCount();
          
          // Auto-eliminate notes after placing a valid number
          this.autoEliminateNotesAfterMove(row, col, n);
          
          // Reset move status after showing correct move image
          setTimeout(() => {
            this.lastMoveCorrect = null;
          }, 2000);
        }
      } else {
        // Clear cell
        this.board[row][col] = null;
        this.errorCells.delete(`${row}-${col}`);
      }
    }
  }

  hasError(row: number, col: number): boolean {
    return this.errorCells.has(`${row}-${col}`);
  }

  isHighlighted(row: number, col: number): boolean {
    return this.highlightedCells.has(`${row}-${col}`);
  }

  clearHighlights() {
    this.highlightedCells.clear();
  }

  // Auto-eliminate notes when a number is placed
  autoEliminateNotesAfterMove(row: number, col: number, num: number | null) {
    if (num === null) return;

    // Eliminate from row
    for (let x = 0; x < 9; x++) {
      if (x !== col) {
        const key = `${row}-${x}`;
        if (this.notes.has(key)) {
          this.notes.get(key)!.delete(num);
          if (this.notes.get(key)!.size === 0) {
            this.notes.delete(key);
          }
        }
      }
    }

    // Eliminate from column
    for (let x = 0; x < 9; x++) {
      if (x !== row) {
        const key = `${x}-${col}`;
        if (this.notes.has(key)) {
          this.notes.get(key)!.delete(num);
          if (this.notes.get(key)!.size === 0) {
            this.notes.delete(key);
          }
        }
      }
    }

    // Eliminate from 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (boxRow + i !== row || boxCol + j !== col) {
          const key = `${boxRow + i}-${boxCol + j}`;
          if (this.notes.has(key)) {
            this.notes.get(key)!.delete(num);
            if (this.notes.get(key)!.size === 0) {
              this.notes.delete(key);
            }
          }
        }
      }
    }
  }

  // Auto-eliminate notes using advanced Sudoku techniques
  autoEliminateNotes() {
    let eliminated = false;

    // Basic elimination - remove impossible notes
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this.board[i][j] === null) {
          const key = `${i}-${j}`;
          if (this.notes.has(key)) {
            const notes = this.notes.get(key)!;
            const validNotes = new Set<number>();
            
            notes.forEach(note => {
              if (this.isValidMove(i, j, note)) {
                validNotes.add(note);
              } else {
                eliminated = true;
              }
            });

            if (validNotes.size === 0) {
              this.notes.delete(key);
            } else {
              this.notes.set(key, validNotes);
            }
          }
        }
      }
    }

    // Naked triples elimination
    eliminated = this.eliminateNakedTriples() || eliminated;
  }

  // Detect and eliminate naked triples
  eliminateNakedTriples(): boolean {
    let eliminated = false;

    // Check rows
    for (let row = 0; row < 9; row++) {
      eliminated = this.eliminateNakedTriplesInUnit('row', row) || eliminated;
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      eliminated = this.eliminateNakedTriplesInUnit('col', col) || eliminated;
    }

    // Check boxes
    for (let box = 0; box < 9; box++) {
      eliminated = this.eliminateNakedTriplesInUnit('box', box) || eliminated;
    }

    return eliminated;
  }

  eliminateNakedTriplesInUnit(type: 'row' | 'col' | 'box', index: number): boolean {
    const cells: { row: number, col: number, notes: Set<number> }[] = [];
    
    // Get all cells in the unit with their notes
    for (let i = 0; i < 9; i++) {
      let row, col;
      
      if (type === 'row') {
        row = index;
        col = i;
      } else if (type === 'col') {
        row = i;
        col = index;
      } else { // box
        const boxRow = Math.floor(index / 3) * 3;
        const boxCol = (index % 3) * 3;
        row = boxRow + Math.floor(i / 3);
        col = boxCol + (i % 3);
      }

      if (this.board[row][col] === null) {
        const key = `${row}-${col}`;
        if (this.notes.has(key)) {
          const notes = this.notes.get(key)!;
          if (notes.size >= 2 && notes.size <= 3) {
            cells.push({ row, col, notes: new Set(notes) });
          }
        }
      }
    }

    // Look for naked triples
    for (let i = 0; i < cells.length - 2; i++) {
      for (let j = i + 1; j < cells.length - 1; j++) {
        for (let k = j + 1; k < cells.length; k++) {
          const combined = new Set([
            ...cells[i].notes,
            ...cells[j].notes,
            ...cells[k].notes
          ]);

          // If three cells contain exactly three numbers total, it's a naked triple
          if (combined.size === 3) {
            let eliminated = false;
            const tripleNumbers = Array.from(combined);
            
            // Remove these numbers from other cells in the unit
            for (let x = 0; x < 9; x++) {
              let row, col;
              
              if (type === 'row') {
                row = index;
                col = x;
              } else if (type === 'col') {
                row = x;
                col = index;
              } else { // box
                const boxRow = Math.floor(index / 3) * 3;
                const boxCol = (index % 3) * 3;
                row = boxRow + Math.floor(x / 3);
                col = boxCol + (x % 3);
              }

              // Skip the triple cells themselves
              if ((row === cells[i].row && col === cells[i].col) ||
                  (row === cells[j].row && col === cells[j].col) ||
                  (row === cells[k].row && col === cells[k].col)) {
                continue;
              }

              const key = `${row}-${col}`;
              if (this.notes.has(key)) {
                const notes = this.notes.get(key)!;
                tripleNumbers.forEach(num => {
                  if (notes.has(num)) {
                    notes.delete(num);
                    eliminated = true;
                  }
                });

                if (notes.size === 0) {
                  this.notes.delete(key);
                }
              }
            }

            if (eliminated) {
              // Highlight the cells involved in the naked triple
              this.highlightedCells.add(`${cells[i].row}-${cells[i].col}`);
              this.highlightedCells.add(`${cells[j].row}-${cells[j].col}`);
              this.highlightedCells.add(`${cells[k].row}-${cells[k].col}`);
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  isValidMove(row: number, col: number, num: number): boolean {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (x !== col && this.board[row][x] === num) {
        return false;
      }
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (x !== row && this.board[x][col] === num) {
        return false;
      }
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (boxRow + i !== row && boxCol + j !== col && 
            this.board[boxRow + i][boxCol + j] === num) {
          return false;
        }
      }
    }

    return true;
  }

  restartGame() {
    this.stopAllAudio(); // Stop any currently playing audio
    this.heroes = Array(3).fill(this.getHeroEmoji());
    this.gameOver = false;
    this.gameWon = false;
    this.lastMoveCorrect = null;
    this.selectedCell = null;
    this.errorCells.clear();
    this.highlightedCells.clear();
    this.showPossibilities = false;
    this.isNotesMode = false;
    this.notes.clear();
    this.loadNewGame();
  }

  getHint() {
    if (this.gameOver) return;
    
    this.clearHighlights();

    // Only use API solution for hints - no algorithms
    if (!this.solution || this.solution.length === 0) {
      return;
    }

    // Find all empty cells
    const emptyCells: {row: number, col: number}[] = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this.board[i][j] === null && this.solution[i] && this.solution[i][j]) {
          emptyCells.push({row: i, col: j});
        }
      }
    }

    if (emptyCells.length > 0) {
      // Pick a random empty cell
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const correctNum = this.solution[randomCell.row][randomCell.col];
      
      // Place the correct number from API solution
      this.board[randomCell.row][randomCell.col] = correctNum;
      this.highlightedCells.add(`${randomCell.row}-${randomCell.col}`);
      this.lastMoveCorrect = true;
      
      // Auto-eliminate notes after hint placement
      this.autoEliminateNotesAfterMove(randomCell.row, randomCell.col, correctNum);
      
      // Update enemy count after hint
      this.updateEnemyCount();
      
      // Reset move status after showing hint
      setTimeout(() => {
        this.lastMoveCorrect = null;
      }, 2000);
    }
  }


}
