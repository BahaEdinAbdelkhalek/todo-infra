export const typeDefs = `#graphql
  enum Priority { LOW MEDIUM HIGH }

  type Todo {
    id: ID!
    title: String!
    description: String
    completed: Boolean!
    priority: Priority!
    createdAt: String!
    updatedAt: String!
  }

  type TodosResult {
    todos: [Todo!]!
    total: Int!
  }

  input CreateTodoInput {
    title: String!
    description: String
    priority: Priority = MEDIUM
  }

  input UpdateTodoInput {
    title: String
    description: String
    completed: Boolean
    priority: Priority
  }

  type Query {
    todos(limit: Int = 20, offset: Int = 0): TodosResult!
    todo(id: ID!): Todo
    health: String!
  }

  type Mutation {
    createTodo(input: CreateTodoInput!): Todo!
    updateTodo(id: ID!, input: UpdateTodoInput!): Todo!
    deleteTodo(id: ID!): Boolean!
    toggleTodo(id: ID!): Todo!
  }
`;
