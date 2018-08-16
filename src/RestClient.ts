import { ApiResponse } from "./ApiResponse";
import { ApiResult } from "./ApiResult";
import { IAuthClient } from "./AuthClient";
import { IJsonProcessor } from "./IJsonProcessor";

export class RestClient {
  public baseUri: string;
  public authClient: IAuthClient;

  public inboundProcessors: IJsonProcessor[] = [];
  public outboundProcessors: IJsonProcessor[] = [];

  constructor(baseUri: string = "", authClient: IAuthClient) {
    this.baseUri = baseUri;
    this.authClient = authClient;
  }

  public get(uri): Promise<ApiResponse> {
    return this.invoke("GET", uri, null);
  }

  public async getAs<T>(uri): Promise<ApiResult<T>> {
    const response = await this.get(uri);
    return this.parseResult<T>(response);
  }

  public post(uri, data?): Promise<ApiResponse> {
    return this.invoke("POST", uri, data);
  }

  public async postAs<T>(uri, data?): Promise<ApiResult<T>> {
    const response = await this.post(uri, data);
    return this.parseResult<T>(response);
  }

  public put(uri, data?): Promise<ApiResponse> {
    return this.invoke("PUT", uri, data);
  }

  public async putAs<T>(uri, data?): Promise<ApiResult<T>> {
    const response = await this.put(uri, data);
    return this.parseResult<T>(response);
  }

  public delete(uri, data?): Promise<ApiResponse> {
    return this.invoke("DELETE", uri, data);
  }

  public async deleteAs<T>(uri, data?): Promise<ApiResult<T>> {
    const response = await this.delete(uri, data);
    return this.parseResult<T>(response);
  }

  public invoke(
    method: string,
    uri: string,
    data?: any,
    headers?: Headers
  ): Promise<ApiResponse> {
    return this.invokeWithRetries(method, uri, data, 0, headers);
  }

  private async invokeWithRetries(
    method,
    uri,
    data,
    retryCounter: number,
    headers?: Headers
  ): Promise<ApiResponse> {
    try {
      let body = null;

      const hs = headers || new Headers();
      hs.append("Accept", "application/json");

      if (this.authClient) {
        await this.authClient.setAuthHeader(hs);
      }

      if (data) {
        hs.append("Content-Type", "application/json");

        let jsonObj = data;
        this.outboundProcessors.forEach(
          p => (jsonObj = p.processJson(jsonObj))
        );
        body = JSON.stringify(jsonObj);
      }

      const request = {
        body,
        method,
        headers: hs
      };

      // construct URI with base URI
      const requestUri = this.baseUri + uri;

      // send request
      const res: Response = await fetch(requestUri, request);

      // we're done
      //  - if we're all good
      //  - if we attempted already the max amount of retries
      //  - in case of client errors (HTTP 4xx) unless it may be an expired token
      if (res.ok || retryCounter >= 3) {
        return new ApiResponse(res, undefined, retryCounter);
      }

      if (res.status === 401 && retryCounter === 0 && this.authClient) {
        // in case of an initial 401, refresh the token and retry
        // if this blows up, the refresh error will be returned as the
        // API result, which should serve well to diagnose things
        await this.authClient.refreshToken();
      } else if (res.status < 500) {
        // give up on all other error conditions < 500
        return new ApiResponse(res, undefined, retryCounter);
      } else {
        // otherwise delay, then recurse to try again (incrementing delays between attempts)
        const delay = retryCounter * 1200;
        await new Promise(r => setTimeout(r, delay));
      }

      return await this.invokeWithRetries(method, uri, data, retryCounter + 1);
    } catch (error) {
      // we didn't even manage to get a response
      return new ApiResponse(undefined, error, retryCounter);
    }
  }

  private async parseResult<T>(response: ApiResponse): Promise<ApiResult<T>> {
    try {
      if (!response.success) {
        // just wrap the original result
        return new ApiResult<T>(
          undefined,
          response.response,
          response.error,
          response.attempts
        );
      }

      // retrieve JSON data
      let json: any = await response.response.json();

      // process/transform JSON
      this.inboundProcessors.forEach(p => (json = p.processJson(json)));

      // parse JSON and assign result
      const obj: T = json as T;

      return new ApiResult<T>(
        obj,
        response.response,
        undefined,
        response.attempts
      );
    } catch (e) {
      // something went wrong even though we got a response
      return new ApiResult<T>(
        undefined,
        response.response,
        e,
        response.attempts
      );
    }
  }
}
