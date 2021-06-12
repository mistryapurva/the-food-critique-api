import { Response } from "express";

class BadRequest extends Error {
  constructor(message?: string) {
    super(message);

    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ServerError extends Error {
  constructor(message?: string) {
    super(message);

    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

class UnauthorizedError extends Error {
  constructor(message?: string) {
    super(message);

    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

const genericExceptionHandler = (error: any, res: Response) => {
  if (error instanceof BadRequest) {
    res.status(400).json({ error: error.message });
  } else if (error instanceof ServerError) {
    res.status(500).json({ error: error.message });
  } else if (error instanceof UnauthorizedError) {
    res.status(403).json({ error: error.message });
  }
};

export { BadRequest, ServerError, UnauthorizedError, genericExceptionHandler };
