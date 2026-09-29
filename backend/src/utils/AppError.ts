// A known, expected error (bad input, not found, unauthorized, conflict) that we
// surface to the client with a specific status code and message. Optional
// `details` are merged into the JSON response, for example the latest task
// on a 409 conflict.
export class AppError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}