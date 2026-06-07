export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface TodosResult {
  todos: Todo[];
  total: number;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
}
