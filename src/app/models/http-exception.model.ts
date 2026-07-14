class HttpException extends Error {
  errorCode: number;
  body: string | Record<string, unknown>;

  constructor(errorCode: number, body: string | Record<string, unknown>) {
    super(String(body));
    this.errorCode = errorCode;
    this.body = body;
  }
}

export default HttpException;
