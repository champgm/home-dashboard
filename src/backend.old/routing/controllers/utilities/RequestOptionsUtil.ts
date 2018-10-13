import IRequestOptions from '../../../../common/interfaces/IRequestOptions';

/**
 * A utility class to help create options for HTTP requests
 *
 * @class RequestOptionsUtil
 */
export default class RequestOptionsUtil {
  bridgeUri: string;

  /**
   * Creates an instance of RequestOptionsUtil.
   *
   * @param {any} bridgeUri - The URI prefix for all bridge calls.
   *                          It should look something like this:
   *                          http://${bridgeIp}:${bridgePort}/api/${bridgeToken}
   *
   * @memberOf RequestOptionsUtil
   */
  constructor(bridgeUri: string) {
    this.bridgeUri = bridgeUri;
  }

  /**
   * Builds a GET with given URI
   *
   * @param {any} uri - the URI to append to the bridge URI
   * @returns the options object
   *
   * @memberOf RequestOptionsUtil
   */
  simpleGet(uri: string): IRequestOptions {
    const getOptions: IRequestOptions = {
      method: 'GET',
      uri: `${this.bridgeUri}/${uri}`,
      json: true
    };
    return getOptions;
  }

  delete(uri: string): IRequestOptions {
    const deleteOptions: IRequestOptions = {
      method: 'DELETE',
      uri: `${this.bridgeUri}/${uri}`,
      json: true
    };
    return deleteOptions;
  }

  /**
   * Builds a PUT with the given URI and includes the given body
   *
   * @param {any} uri - the URI to append to the bridge URI
   * @param {any} body - the body to send
   * @returns the options object
   *
   * @memberOf RequestOptionsUtil
   */
  putWithBody(uri: string, body: any): IRequestOptions {
    const putOptions: IRequestOptions = {
      method: 'PUT',
      uri: `${this.bridgeUri}/${uri}`,
      json: true,
      body
    };
    return putOptions;
  }

  postWithBody(uri: string, body: any): IRequestOptions {
    const postOptions: IRequestOptions = {
      method: 'POST',
      uri: `${this.bridgeUri}/${uri}`,
      json: true,
      body
    };
    return postOptions;
  }

}
