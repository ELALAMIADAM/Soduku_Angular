import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="game-container">
      <div class="game-header">
        <h1>Sudoku</h1>
        <div class="hearts">
          <span *ngFor="let heart of hearts" class="heart">❤️</span>
        </div>
      </div>

      <div class="controls">
        <button class="control-btn restart" (click)="restartGame()">
          <span>🔄</span> Restart
        </button>
        <button class="control-btn hint" (click)="getHint()">
          <span>💡</span> Hint
        </button>
      </div>

      <div class="sudoku-grid">
        <div *ngFor="let row of board; let i = index" class="row">
          <div *ngFor="let cell of row; let j = index" 
               class="cell" 
               [class.thick-right]="j === 2 || j === 5"
               [class.thick-bottom]="i === 2 || i === 5"
               [class.error]="hasError(i, j)"
               (click)="openNumberPopup(i, j)">
            <span>{{ cell || '' }}</span>
          </div>
        </div>
      </div>

      <!-- Number selection popup -->
      <div class="popup-backdrop" *ngIf="popupOpen" (click)="closePopup()">
        <div class="popup" (click)="$event.stopPropagation()">
          <div class="popup-header">
            <button class="popup-btn possibilities-btn" (click)="togglePossibilities()">
              {{ showPossibilities ? 'Hide' : 'Show' }} Possibilities
            </button>
            <button class="popup-btn cancel-btn" (click)="closePopup()">✕</button>
          </div>
          
          <div class="popup-content">
            <div class="number-options" *ngIf="!showPossibilities">
              <div class="number-option" *ngFor="let n of numbers" (click)="selectNumber(n)">{{ n }}</div>
              <div class="number-option clear" (click)="selectNumber(null)">Clear</div>
            </div>
            
            <div class="possibilities-grid" *ngIf="showPossibilities">
              <div class="possibility-item" *ngFor="let num of getPossibilities(selectedCell?.row || 0, selectedCell?.col || 0)" 
                   (click)="selectNumber(num)">
                {{ num }}
              </div>
            </div>
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

    .game-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .hearts {
      display: flex;
      gap: 0.25rem;
    }

    .heart {
      font-size: 1.2rem;
      animation: heartBeat 1s infinite;
    }

    @keyframes heartBeat {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .controls {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
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
    }

    .row {
      display: contents;
    }

    .cell {
      background-color: white;
      padding: 8px;
      text-align: center;
      cursor: pointer;
      min-height: 35px;
      font-size: 1.2rem;
      font-weight: 500;
      color: #2c3e50;
      border: 1px solid #bdc3c7;
      user-select: none;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cell.error {
      background-color: #ffebee;
      color: #e74c3c;
    }

    .cell:hover {
      background: #e8f4f8;
      transform: scale(1.02);
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

    .number-options {
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
export class AppComponent {
  title = 'sudoku-angular';
  board: (number | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  hearts = Array(3).fill('❤️');
  gameOver = false;
  errorCells: Set<string> = new Set();
  showPossibilities = false;

  popupOpen = false;
  selectedCell: { row: number, col: number } | null = null;

  openNumberPopup(row: number, col: number) {
    if (this.gameOver) return;
    this.selectedCell = { row, col };
    this.popupOpen = true;
  }

  closePopup() {
    this.popupOpen = false;
    this.selectedCell = null;
    this.showPossibilities = false;
  }

  togglePossibilities() {
    this.showPossibilities = !this.showPossibilities;
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
      this.board[row][col] = n;
      
      if (n !== null && !this.isValidMove(row, col, n)) {
        this.hearts.pop();
        this.errorCells.add(`${row}-${col}`);
        
        if (this.hearts.length === 0) {
          this.gameOver = true;
        }
      } else {
        this.errorCells.delete(`${row}-${col}`);
      }
    }
    this.closePopup();
  }

  hasError(row: number, col: number): boolean {
    return this.errorCells.has(`${row}-${col}`);
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
    this.board = Array(9).fill(null).map(() => Array(9).fill(null));
    this.hearts = Array(3).fill('❤️');
    this.gameOver = false;
    this.errorCells.clear();
    this.showPossibilities = false;
  }

  getHint() {
    if (this.gameOver) return;
    
    // Find all empty cells
    const emptyCells: {row: number, col: number}[] = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (this.board[i][j] === null) {
          emptyCells.push({row: i, col: j});
        }
      }
    }

    if (emptyCells.length > 0) {
      // Pick a random empty cell
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      
      // Find a valid number for this cell
      for (let num = 1; num <= 9; num++) {
        if (this.isValidMove(randomCell.row, randomCell.col, num)) {
          this.board[randomCell.row][randomCell.col] = num;
          break;
        }
      }
    }
  }
}
