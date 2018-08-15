import { ApiResponse } from './ApiResponse';

/**
 * Extends an API response with a result that is automatically
 * built from returned JSON.
 */
export class ApiResult<T> extends ApiResponse {
  public value: T;

  constructor(val: T, res: Response, error, attempts: number) {
    super(res, error, attempts);

    this.value = val;
    this.response = res;
    this.error = error;
    this.attempts = attempts;
  }
}
