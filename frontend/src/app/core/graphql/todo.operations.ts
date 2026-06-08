import { gql } from 'apollo-angular';

export const TODO_FIELDS = gql`
  fragment TodoFields on Todo {
    id title description completed priority createdAt updatedAt
  }
`;

export const GET_TODOS = gql`
  ${TODO_FIELDS}
  query GetTodos($limit: Int, $offset: Int) {
    todos(limit: $limit, offset: $offset) { todos { ...TodoFields } total }
  }
`;

export const GET_TODO = gql`
  ${TODO_FIELDS}
  query GetTodo($id: ID!) { todo(id: $id) { ...TodoFields } }
`;

export const CREATE_TODO = gql`
  ${TODO_FIELDS}
  mutation CreateTodo($input: CreateTodoInput!) { createTodo(input: $input) { ...TodoFields } }
`;

export const UPDATE_TODO = gql`
  ${TODO_FIELDS}
  mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) { updateTodo(id: $id, input: $input) { ...TodoFields } }
`;

export const TOGGLE_TODO = gql`
  ${TODO_FIELDS}
  mutation ToggleTodo($id: ID!) { toggleTodo(id: $id) { ...TodoFields } }
`;

export const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) { deleteTodo(id: $id) }
`;
