import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TodoService } from '../../../core/services/todo.service';
import { Todo, Priority, CreateTodoInput } from '../../../core/graphql/todo.types';
import { TodoItemComponent } from '../todo-item/todo-item.component';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TodoItemComponent],
  template: `
    <div class="container mx-auto max-w-2xl px-4 py-12">
      <div class="mb-10">
        <h1 class="text-4xl font-extrabold tracking-tight">Tasks</h1>
        <p class="mt-2 text-sm text-muted-foreground">{{ pending() }} remaining · {{ todos().length }} total</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onCreate()" class="mb-8 space-y-3">
        <div class="flex gap-2">
          <input formControlName="title" placeholder="What needs to be done?"
            class="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50" />
          <select formControlName="priority"
            class="w-28 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          <button type="submit" [disabled]="form.invalid || creating()"
            class="inline-flex items-center justify-center h-10 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
            {{ creating() ? 'Adding…' : 'Add' }}
          </button>
        </div>
        <input formControlName="description" placeholder="Description (optional)"
          class="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
      </form>

      <div *ngIf="loading()" class="py-8 text-center text-sm text-muted-foreground">Loading tasks…</div>

      <div *ngIf="error()" class="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {{ error() }}
      </div>

      <div *ngIf="!loading() && todos().length" class="mb-4 flex gap-1">
        <button *ngFor="let f of filters" (click)="activeFilter.set(f.value)"
          class="inline-flex items-center justify-center h-9 rounded-md px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          [class.bg-accent]="activeFilter() === f.value"
          [class.text-accent-foreground]="activeFilter() === f.value">
          {{ f.label }}
        </button>
      </div>

      <div class="space-y-2">
        <app-todo-item
          *ngFor="let todo of filteredTodos(); trackBy: trackById"
          [todo]="todo"
          (toggle)="onToggle($event)"
          (delete)="onDelete($event)" />
      </div>

      <div *ngIf="!loading() && filteredTodos().length === 0 && !error()" class="py-16 text-center text-muted-foreground">
        <p class="text-lg">All clear ✓</p>
        <p class="text-sm">Add a task above to get started.</p>
      </div>
    </div>
  `,
})
export class TodoListComponent implements OnInit {
  private todoService = inject(TodoService);
  private fb = inject(FormBuilder);

  todos        = signal<Todo[]>([]);
  loading      = signal(true);
  creating     = signal(false);
  error        = signal<string | null>(null);
  activeFilter = signal<'all' | 'active' | 'done'>('all');

  filters = [
    { label: 'All',    value: 'all'    as const },
    { label: 'Active', value: 'active' as const },
    { label: 'Done',   value: 'done'   as const },
  ];

  form = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    priority:    ['MEDIUM' as Priority],
  });

  ngOnInit() {
    this.todoService.getTodos().subscribe({
      next: (result) => { this.todos.set(result.todos); this.loading.set(false); },
      error: (err)   => { this.error.set('Failed to load tasks. Is the API running?'); this.loading.set(false); console.error(err); },
    });
  }

  pending() { return this.todos().filter((t) => !t.completed).length; }

  filteredTodos() {
    const f = this.activeFilter();
    if (f === 'active') return this.todos().filter((t) => !t.completed);
    if (f === 'done')   return this.todos().filter((t) =>  t.completed);
    return this.todos();
  }

  trackById(_: number, todo: Todo) { return todo.id; }

  onCreate() {
    if (this.form.invalid) return;
    this.creating.set(true);
    const input: CreateTodoInput = {
      title:       this.form.value.title!.trim(),
      description: this.form.value.description?.trim() || undefined,
      priority:    this.form.value.priority as Priority,
    };
    this.todoService.createTodo(input).subscribe({
      next: (todo) => { this.todos.update((l) => [todo, ...l]); this.form.reset({ priority: 'MEDIUM' }); this.creating.set(false); },
      error: (err) => { this.error.set('Failed to create task.'); this.creating.set(false); console.error(err); },
    });
  }

  onToggle(id: string) {
    this.todoService.toggleTodo(id).subscribe({
      next: (updated) => { this.todos.update((l) => l.map((t) => (t.id === updated.id ? updated : t))); },
    });
  }

  onDelete(id: string) {
    this.todoService.deleteTodo(id).subscribe({
      next: () => { this.todos.update((l) => l.filter((t) => t.id !== id)); },
    });
  }
}
