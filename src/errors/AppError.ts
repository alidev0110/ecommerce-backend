class AppError extends Error {
  statusCode: number;
  isOptional: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.isOptional = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export { AppError };
