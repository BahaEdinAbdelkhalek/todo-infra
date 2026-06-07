import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Todo } from '../../../core/graphql/todo.types';

@Component({
  selector: 'app-todo-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
      [class.opacity-60]="todo.completed">

      <!-- Checkbox button -->
      <button
        class="mt-0.5 h-5 w-5 shrink-0 rounded border border-input p-0 inline-flex items-center justify-center transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        [class.bg-primary]="todo.completed"
        [class.border-primary]="todo.completed"
        (click)="toggle.emit(todo.id)"
        [attr.aria-label]="todo.completed ? 'Mark incomplete' : 'Mark complete'">
        <svg *ngIf="todo.completed" xmlns="http://www.w3.org/2000/svg"
          class="h-3 w-3 text-primary-foreground" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
        </svg>
      </button>

      <!-- Text -->
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium leading-snug"
          [class.line-through]="todo.completed"
          [class.text-muted-foreground]="todo.completed">
          {{ todo.title }}
        </p>
        <p *ngIf="todo.description" class="mt-0.5 text-xs text-muted-foreground">
          {{ todo.description }}
        </p>
      </div>

      <!-- Priority badge -->
      <span class="shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
        [ngClass]="{
          'border-transparent bg-destructive text-destructive-foreground': todo.priority === 'HIGH',
          'border-transparent bg-primary text-primary-foreground':         todo.priority === 'MEDIUM',
          'border-transparent bg-secondary text-secondary-foreground':     todo.priority === 'LOW'
        }">
        {{ todo.priority }}
      </span>

      <!-- Delete button -->
      <button
        class="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 inline-flex items-center justify-center rounded-md p-0 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        (click)="delete.emit(todo.id)"
        aria-label="Delete task">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    </div>
  `,
})
export class TodoItemComponent {
  @Input({ required: true }) todo!: Todo;
  @Output() toggle = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();
}
