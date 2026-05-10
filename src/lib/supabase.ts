import { api } from './apiClient';

type Filter = { column: string; value: unknown };
type Order = { column: string; ascending?: boolean };
type Operation = 'select' | 'insert' | 'update' | 'delete';
type QueryResult = { data: any; error: { message: string } | null; count?: number | null };

class QueryBuilder {
  private operation: Operation = 'select';
  private selection = '*';
  private filters: Filter[] = [];
  private orderBy: Order | null = null;
  private rowLimit: number | null = null;
  private rowOffset: number | null = null;
  private payload: unknown;
  private singleMode = false;
  private countMode: 'exact' | null = null;
  private headMode = false;

  constructor(private table: string) {}

  select(selection = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.operation = this.operation === 'insert' || this.operation === 'update' || this.operation === 'delete'
      ? this.operation
      : 'select';
    this.selection = selection;
    this.countMode = options?.count ?? null;
    this.headMode = options?.head ?? false;
    return this;
  }

  insert(payload: unknown) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderBy = { column, ascending: options?.ascending };
    return this;
  }

  limit(value: number) {
    this.rowLimit = value;
    return this;
  }

  range(from: number, to: number) {
    this.rowOffset = from;
    this.rowLimit = Math.max(0, to - from + 1);
    return this;
  }

  maybeSingle() {
    this.singleMode = true;
    return this.execute();
  }

  single() {
    this.singleMode = true;
    return this.execute();
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResult> {
    return api.post('/api/data', {
      table: this.table,
      operation: this.operation,
      selection: this.selection,
      filters: this.filters,
      order: this.orderBy,
      limit: this.rowLimit,
      offset: this.rowOffset,
      payload: this.payload,
      single: this.singleMode,
      count: this.countMode,
      head: this.headMode,
    });
  }
}

export const supabase = {
  from(table: string) {
    return new QueryBuilder(table);
  },
  auth: {
    async getSession() {
      const { data } = await api.get<{ session: { user: { id: string; email: string; role?: string; status?: string } } | null; profile?: unknown }>('/api/auth/session');
      return { data: { session: data?.session ?? null } };
    },
    onAuthStateChange(callback: (event: string, session: { user: { id: string; email: string } } | null) => void) {
      void api.get<{ session: { user: { id: string; email: string; role?: string; status?: string } } | null }>('/api/auth/session').then(({ data }) => {
        callback(data?.session ? 'SIGNED_IN' : 'SIGNED_OUT', data?.session ?? null);
      });
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, string> } }) {
      const result = await api.post<{ user: { id: string; email: string } }>('/api/auth/signup', {
        email,
        password,
        username: options?.data?.username,
        fullName: options?.data?.fullName,
      });
      return { data: { user: result.data?.user ?? null }, error: result.error };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const result = await api.post<{ user: { id: string; email: string } }>('/api/auth/signin', { email, password });
      return { data: { user: result.data?.user ?? null }, error: result.error };
    },
    async signOut(_options?: unknown) {
      return api.post('/api/auth/signout');
    },
  },
};
