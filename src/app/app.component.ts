import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="game-container">
      <div class="game-header">
        <h1>Sudoku Battle</h1>
        <div class="header-controls">
          <div class="theme-selection">
            <label>Battle Theme:</label>
            <select [(ngModel)]="selectedTheme" (change)="onThemeChange()" class="theme-select">
              <option value="soldiers">Soldiers vs Zombies</option>
              <option value="samurai">Samurais vs Ninjas</option>
            </select>
          </div>

          <div class="difficulty-selection">
            <label>Difficulty:</label>
            <select [(ngModel)]="selectedDifficulty" (change)="onDifficultyChange()" class="difficulty-select">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div class="controls">
            <button class="control-btn restart" (click)="restartGame()">
              <span>🔄</span> New Game
            </button>
            <button class="control-btn hint" (click)="getHint()">
              <span>💡</span> Hint
            </button>
            <button class="control-btn eliminate" (click)="autoEliminateNotes()">
              <span>🧹</span> Auto-Eliminate
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

          <div class="notes-grid" *ngIf="isNotesMode">
            <div class="note-item" *ngFor="let n of numbers" 
                 [class.active]="isNoteActive(n)"
                 (click)="toggleNote(n)">
              {{ n }}
            </div>
            <div class="note-item clear" (click)="clearNotes()">Clear Notes</div>
          </div>
        </div>
      </div>

      <!-- Game Over Modal -->
      <div class="modal-backdrop" *ngIf="gameOver" (click)="restartGame()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Game Over!</h2>
          <p>You've run out of hearts. Would you like to try again?</p>
          <button class="modal-btn" (click)="restartGame()">Play Again</button>
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
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 1rem;
      box-sizing: border-box;
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
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .header-controls {
      display: flex;
      gap: 2rem;
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
      background: rgba(255, 255, 255, 0.95);
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      min-width: 200px;
      border: 2px solid #e8f4f8;
    }

    .battle-title {
      font-size: 1.1rem;
      font-weight: bold;
      color: #2c3e50;
      text-align: center;
      margin-bottom: 0.5rem;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
    }

    .heroes-section, .enemies-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .section-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #34495e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .heroes {
      display: flex;
      gap: 0.25rem;
    }

    .hero {
      font-size: 1.4rem;
      animation: heroStand 2s infinite;
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3));
    }

    .battle-image {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0.5rem 0;
      border-top: 1px solid #ecf0f1;
      border-bottom: 1px solid #ecf0f1;
    }

    .battle-img {
      width: 150px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    }

    .battle-img:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    .enemies {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .enemy-count {
      font-size: 1.2rem;
      font-weight: bold;
      color: #2c3e50;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
    }

    @keyframes heroStand {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-2px); }
    }

    .theme-selection {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .theme-selection label {
      color: #2c3e50;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .theme-select {
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

    .theme-select:hover, .theme-select:focus {
      border-color: #3498db;
      outline: none;
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

    .eliminate {
      background: #9b59b6;
      color: white;
    }

    .control-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    h1 {
      color: #2c3e50;
      font-size: 1.8rem;
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
      border: 2px solid #2c3e50;
      border-radius: 4px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      width: 360px;
      position: relative;
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
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        width: 200px;
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

      .number-grid, .notes-grid {
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
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .modal {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      max-width: 300px;
      animation: modalFadeIn 0.3s ease;
    }

    .modal h2 {
      color: #e74c3c;
      margin-bottom: 1rem;
    }

    .modal-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-size: 1.1rem;
      cursor: pointer;
      margin-top: 1rem;
      transition: all 0.2s ease;
    }

    .modal-btn:hover {
      background: #2980b9;
      transform: translateY(-2px);
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
  selectedDifficulty = 'medium';
  selectedTheme = 'soldiers';
  loading = false;
  enemyCount = 0;

  selectedCell: { row: number, col: number } | null = null;
  lastMoveCorrect: boolean | null = null;
  gameWon = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadNewGame();
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
      // Game lost
      if (this.gameOver) {
        return '/ninja_battle/ninja_battle_6.jpeg';
      }

      // Game won
      if (this.gameWon) {
        return '/ninja_battle/ninja_battle_5.jpeg';
      }

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
      // Game lost
      if (this.gameOver) {
        return '/zombie_battle/zombie_battle_6.jpeg';
      }

      // Game won
      if (this.gameWon) {
        return '/zombie_battle/zombie_battle_5.jpeg';
      }

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

  onThemeChange() {
    // Update heroes based on theme
    this.heroes = Array(3).fill(this.getHeroEmoji());
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
    try {
      const response = await this.http.get<any>(`https://sudoku-api.vercel.app/api/dosuku?query={newboard(limit:1){grids{value,solution,difficulty}}}`).toPromise();
      
      if (response && response.newboard && response.newboard.grids && response.newboard.grids.length > 0) {
        const grid = response.newboard.grids[0];
        this.board = this.convertGrid(grid.value);
        this.solution = this.convertGrid(grid.solution);
      }
    } catch (error) {
      console.error('Failed to load puzzle from API, using empty board', error);
      this.board = Array(9).fill(null).map(() => Array(9).fill(null));
      this.solution = Array(9).fill(null).map(() => Array(9).fill(null));
    }
    this.loading = false;
    this.gameWon = false;
    this.lastMoveCorrect = null;
    this.updateEnemyCount();
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
          }
        } else {
          // Correct number or no solution available
          this.lastMoveCorrect = true;
          this.board[row][col] = n;
          this.errorCells.delete(`${row}-${col}`);
          
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
