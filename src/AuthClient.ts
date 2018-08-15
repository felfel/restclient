/**
 * Performs token-based authentication with a 3rd party provider.
 */

export interface IAuthClient {
  /**
   * Resolves to the current auth token. Will fail in case
   * of a token fetch error.
   * @returns {Promise<string>} A promise that will resolve to the actual token.
   */
  token: Promise<string>;

  /**
   * Asynchronously refreshes the token. This sets the
   * token promise of the client.
   * @returns {Promise<void>}
   */
  refreshToken(): Promise<void>;

  /**
   * Updates the header to be sent with an HTTP
   * request in order to provide authentication.
   */
  setAuthHeader(headers: Headers): Promise<void>;
}
