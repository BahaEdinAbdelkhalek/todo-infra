import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { GET_TODOS, GET_TODO, CREATE_TODO, UPDATE_TODO, TOGGLE_TODO, DELETE_TODO } from '../graphql/todo.operations';
import { Todo, TodosResult, CreateTodoInput, UpdateTodoInput } from '../graphql/todo.types';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private apollo = inject(Apollo);

  getTodos(limit = 20, offset = 0): Observable<TodosResult> {
    return this.apollo
      .watchQuery<{ todos: TodosResult }>({ query: GET_TODOS, variables: { limit, offset } })
      .valueChanges.pipe(map((r) => r.data.todos));
  }

  getTodo(id: string): Observable<Todo | null> {
    return this.apollo
      .watchQuery<{ todo: Todo | null }>({ query: GET_TODO, variables: { id } })
      .valueChanges.pipe(map((r) => r.data.todo));
  }

  createTodo(input: CreateTodoInput): Observable<Todo> {
    return this.apollo
      .mutate<{ createTodo: Todo }>({
        mutation: CREATE_TODO, variables: { input },
        refetchQueries: [{ query: GET_TODOS, variables: { limit: 20, offset: 0 } }],
      })
      .pipe(map((r) => r.data!.createTodo));
  }

  updateTodo(id: string, input: UpdateTodoInput): Observable<Todo> {
    return this.apollo
      .mutate<{ updateTodo: Todo }>({
        mutation: UPDATE_TODO, variables: { id, input },
        refetchQueries: [{ query: GET_TODOS, variables: { limit: 20, offset: 0 } }],
      })
      .pipe(map((r) => r.data!.updateTodo));
  }

  toggleTodo(id: string): Observable<Todo> {
    return this.apollo
      .mutate<{ toggleTodo: Todo }>({
        mutation: TOGGLE_TODO, variables: { id },
        refetchQueries: [{ query: GET_TODOS, variables: { limit: 20, offset: 0 } }],
      })
      .pipe(map((r) => r.data!.toggleTodo));
  }

  deleteTodo(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteTodo: boolean }>({
        mutation: DELETE_TODO, variables: { id },
        refetchQueries: [{ query: GET_TODOS, variables: { limit: 20, offset: 0 } }],
      })
      .pipe(map((r) => r.data!.deleteTodo));
  }
}
