import { ApiResponse } from './ApiResponse';
import { IAuthClient } from './AuthClient';

/**
 * Provides token-based authentication with Keycloak.
 */
export class KeycloakAuthClient implements IAuthClient {
  public token: Promise<string> = undefined;

  constructor(
    private authEndpointUri: string,
    private clientId: string,
    private secret: string,
    private username?: string
  ) {}

  public async refreshToken(): Promise<void> {
    // poor man's deferred:
    let resolve;
    let reject;
    this.token = new Promise<string>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const response = await this.getToken();
    if (response.success) {
      // retrieve JSON data
      const json: any = await response.response.json();
      const token = json.access_token;
      if (!token) {
        const error = new Error(
          'Token fetch error - no access_token found in resolved JSON: ' +
            JSON.stringify(json)
        );
        reject(error);
        throw error;
      }

      // assign token
      resolve(token);
      return json.access_token;
    } else {
      const error = new Error(
        'Token fetch error: ' + response.getErrorMessage()
      );
      reject(error);
      throw error;
    }
  }

  public async setAuthHeader(headers: Headers): Promise<void> {
    // await the auth token if it's not ready yet.
    // if the promise fails, this will fail
    const token: string = await this.token;
    if (token) {
      headers.append('Authorization', 'Bearer ' + token);
    }
  }

  public async getToken(): Promise<ApiResponse> {
    const headers = {
      'Content-type': 'application/x-www-form-urlencoded',
    };
    let body: string;
    if (this.username) {
      body = `grant_type=password&client_id=${this.clientId}&username=${
        this.username
      }&password=${this.secret}`;
    } else {
      body = `grant_type=client_credentials&client_id=${
        this.clientId
      }&client_secret=${this.secret}`;
    }

    const request = {
      headers,
      body,
      method: 'POST',
    };

    // send request
    const res: Response = await fetch(this.authEndpointUri, request);
    return new ApiResponse(res, undefined, 0);
  }
}
