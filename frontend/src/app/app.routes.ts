import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () =>
			import('./features/todos/todo-list/todo-list.component').then(
				(m) => m.TodoListComponent
			),
	},
	{ path: '**', redirectTo: '' },
];
