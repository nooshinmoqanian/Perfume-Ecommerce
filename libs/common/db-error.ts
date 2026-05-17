export class DatabaseError extends Error {
  public original?: unknown;

  constructor(message: string, original?: unknown) {
    super(message);
    this.name = 'DatabaseError';
    this.original = original;
  }
}

export default DatabaseError;
