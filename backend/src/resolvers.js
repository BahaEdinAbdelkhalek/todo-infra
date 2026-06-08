import { query } from './db.js';
import { cacheGet, cacheSet, cacheInvalidatePattern } from './cache.js';
import { GraphQLError } from 'graphql';

function mapRow(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? null,
    completed: row.completed,
    priority: row.priority,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function invalidateTodosCache() {
  await cacheInvalidatePattern('todos:*');
}

export const resolvers = {
  Query: {
    health: () => 'ok',
    todos: async (_parent, { limit, offset }) => {
      const cacheKey = `todos:list:${limit}:${offset}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return cached;
      const { rows } = await query(
        'SELECT *, COUNT(*) OVER() AS total_count FROM todos ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      const result = { todos: rows.map(mapRow), total: rows.length ? Number(rows[0].total_count) : 0 };
      await cacheSet(cacheKey, result, 30);
      return result;
    },
    todo: async (_parent, { id }) => {
      const cached = await cacheGet(`todos:one:${id}`);
      if (cached) return cached;
      const { rows } = await query('SELECT * FROM todos WHERE id = $1', [id]);
      if (!rows.length) throw new GraphQLError('Todo not found', { extensions: { code: 'NOT_FOUND' } });
      const todo = mapRow(rows[0]);
      await cacheSet(`todos:one:${id}`, todo, 60);
      return todo;
    },
  },
  Mutation: {
    createTodo: async (_parent, { input }) => {
      const { title, description = null, priority = 'MEDIUM' } = input;
      const { rows } = await query(
        'INSERT INTO todos (title, description, priority) VALUES ($1, $2, $3) RETURNING *',
        [title, description, priority]
      );
      await invalidateTodosCache();
      return mapRow(rows[0]);
    },
    updateTodo: async (_parent, { id, input }) => {
      const current = await query('SELECT * FROM todos WHERE id = $1', [id]);
      if (!current.rows.length) throw new GraphQLError('Todo not found', { extensions: { code: 'NOT_FOUND' } });
      const row = current.rows[0];
      const { rows } = await query(
        'UPDATE todos SET title=$1, description=$2, completed=$3, priority=$4 WHERE id=$5 RETURNING *',
        [input.title ?? row.title, input.description ?? row.description, input.completed ?? row.completed, input.priority ?? row.priority, id]
      );
      await invalidateTodosCache();
      await cacheInvalidatePattern(`todos:one:${id}`);
      return mapRow(rows[0]);
    },
    toggleTodo: async (_parent, { id }) => {
      const { rows } = await query('UPDATE todos SET completed = NOT completed WHERE id=$1 RETURNING *', [id]);
      if (!rows.length) throw new GraphQLError('Todo not found', { extensions: { code: 'NOT_FOUND' } });
      await invalidateTodosCache();
      await cacheInvalidatePattern(`todos:one:${id}`);
      return mapRow(rows[0]);
    },
    deleteTodo: async (_parent, { id }) => {
      const { rowCount } = await query('DELETE FROM todos WHERE id=$1', [id]);
      if (!rowCount) throw new GraphQLError('Todo not found', { extensions: { code: 'NOT_FOUND' } });
      await invalidateTodosCache();
      await cacheInvalidatePattern(`todos:one:${id}`);
      return true;
    },
  },
};
