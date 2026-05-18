export class AppError extends Error {
  public status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') { super(message, 400); }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not Found') { super(message, 404); }
}

export class StorageError extends AppError {
  constructor(message = 'Storage Error') { super(message, 500); }
}

export default { AppError, BadRequestError, NotFoundError, StorageError };
