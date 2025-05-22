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
        <h1>Sudoku</h1>
        <div class="hearts">
          <span *ngFor="let heart of hearts" class="heart">❤️</span>
        </div>
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
               (click)="openNumberPopup(i, j)">
            <span class="cell-value">{{ cell || '' }}</span>
            <div class="notes-grid" *ngIf="!cell && getNotes(i, j).length > 0">
              <span *ngFor="let note of getNotes(i, j)" class="note">{{ note }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Number selection popup -->
      <div class="popup-backdrop" *ngIf="popupOpen" (click)="closePopup()">
        <div class="popup" (click)="$event.stopPropagation()">
          <div class="popup-header">
            <div class="popup-buttons">
              <button class="popup-btn notes-btn" [class.active]="isNotesMode" (click)="toggleNotesMode()">
                {{ isNotesMode ? 'Numbers' : 'Notes' }}
              </button>
            </div>
            <button class="popup-btn cancel-btn" (click)="closePopup()">✕</button>
          </div>
          
          <div class="popup-content">
            <div class="possibilities-grid" *ngIf="!isNotesMode">
              <div class="possibility-item" *ngFor="let num of numbers" 
                   [class.valid]="isValidMove(selectedCell?.row || 0, selectedCell?.col || 0, num)"
                   [class.invalid]="!isValidMove(selectedCell?.row || 0, selectedCell?.col || 0, num)"
                   (click)="selectNumber(num)">
                {{ num }}
              </div>
              <div class="possibility-item clear" (click)="selectNumber(null)">Clear</div>
            </div>

            <div class="notes-options" *ngIf="isNotesMode">
              <div class="number-option" *ngFor="let n of numbers" 
                   [class.active]="isNoteActive(n)"
                   [class.valid]="isValidMove(selectedCell?.row || 0, selectedCell?.col || 0, n)"
                   [class.invalid]="!isValidMove(selectedCell?.row || 0, selectedCell?.col || 0, n)"
                   (click)="toggleNote(n)">
                {{ n }}
              </div>
              <div class="number-option clear" (click)="clearNotes()">Clear Notes</div>
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

      <!-- Hint Modal -->
      <div class="modal-backdrop" *ngIf="hintMessage" (click)="clearHint()">
        <div class="modal hint-modal" (click)="$event.stopPropagation()">
          <h3>💡 Hint</h3>
          <p>{{ hintMessage }}</p>
          <button class="modal-btn" (click)="clearHint()">Got it!</button>
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

    .difficulty-selection {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .difficulty-selection label {
      color: #2c3e50;
      font-weight: 600;
    }

    .difficulty-select {
      padding: 0.5rem;
      border: 2px solid #bdc3c7;
      border-radius: 6px;
      background: white;
      color: #2c3e50;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .difficulty-select:hover, .difficulty-select:focus {
      border-color: #3498db;
      outline: none;
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
      position: relative;
    }

    .cell-value {
      position: absolute;
      font-size: 1.2rem;
    }

    .notes-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(3, 1fr);
      width: 100%;
      height: 100%;
      font-size: 0.6rem;
      color: #666;
    }

    .note {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cell.error {
      background-color: #ffebee;
      color: #e74c3c;
    }

    .cell.highlighted {
      background-color: #fff3cd;
      border-color: #f39c12;
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
  hearts = Array(3).fill('❤️');
  gameOver = false;
  errorCells: Set<string> = new Set();
  highlightedCells: Set<string> = new Set();
  showPossibilities = false;
  isNotesMode = false;
  notes: Map<string, Set<number>> = new Map();
  hintMessage = '';
  selectedDifficulty = 'medium';
  loading = false;

  popupOpen = false;
  selectedCell: { row: number, col: number } | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadNewGame();
  }

  onDifficultyChange() {
    this.loadNewGame();
  }

  openNumberPopup(row: number, col: number) {
    if (this.gameOver) return;
    this.selectedCell = { row, col };
    this.popupOpen = true;
    this.clearHighlights();
  }

  closePopup() {
    this.popupOpen = false;
    this.selectedCell = null;
    this.showPossibilities = false;
    this.isNotesMode = false;
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
      this.board[row][col] = n;
      
      // Clear notes when a number is selected
      const key = `${row}-${col}`;
      this.notes.delete(key);
      
      if (n !== null && !this.isValidMove(row, col, n)) {
        this.hearts.pop();
        this.errorCells.add(`${row}-${col}`);
        
        if (this.hearts.length === 0) {
          this.gameOver = true;
        }
      } else {
        this.errorCells.delete(`${row}-${col}`);
        // Auto-eliminate notes after placing a number
        this.autoEliminateNotesAfterMove(row, col, n);
      }
    }
    this.closePopup();
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

    if (eliminated) {
      this.hintMessage = "Eliminated impossible notes using advanced techniques!";
    } else {
      this.hintMessage = "No notes could be eliminated at this time.";
    }
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
    this.hearts = Array(3).fill('❤️');
    this.gameOver = false;
    this.errorCells.clear();
    this.highlightedCells.clear();
    this.showPossibilities = false;
    this.isNotesMode = false;
    this.notes.clear();
    this.hintMessage = '';
    this.loadNewGame();
  }

  getHint() {
    if (this.gameOver) return;
    
    this.clearHighlights();

    // Only use API solution for hints - no algorithms
    if (!this.solution || this.solution.length === 0) {
      this.hintMessage = "No solution available. Please start a new game to get hints.";
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
      this.hintMessage = `Hint: Placed ${correctNum} at row ${randomCell.row + 1}, column ${randomCell.col + 1}`;
      
      // Auto-eliminate notes after hint placement
      this.autoEliminateNotesAfterMove(randomCell.row, randomCell.col, correctNum);
    } else {
      this.hintMessage = "Congratulations! The puzzle is complete!";
    }
  }

  clearHint() {
    this.hintMessage = '';
    this.clearHighlights();
  }
}
