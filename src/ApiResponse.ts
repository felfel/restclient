export class ApiResponse {
  response: Response;
  error: any;
  attempts: number;

  get status(): number {
    return this.response ? this.response.status : -1;
  }

  get success(): boolean {
    //check for successful response plus no errors (could happen during JSON access/parsing)
    return this.response && this.response.ok && this.error === undefined;
  }

  get forbidden(): boolean {
    return this.response && this.response.status === 403;
  }

  get notFound(): boolean {
    return this.response && this.response.status === 404;
  }

  constructor(res: Response, error, attempts: number) {
    this.response = res;
    this.error = error;
    this.attempts = attempts;
  }

  getErrorMessage() {
    if (this.error) {
      return `Service access error: ${this.error}`;
    }

    const res = this.response;
    const statusText = res.statusText ? res.statusText : "HTTP Error";
    return `${statusText} (${this.status}).`;
  }
}
