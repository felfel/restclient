import parse from 'date-fns/parse';
import { camelizeKeys, decamelizeKeys } from 'humps';

export interface IJsonProcessor {
  // tslint:disable-next-line
  processJson(json: object): object;
}

export class SnakeToCamelProcessor implements IJsonProcessor {
  // tslint:disable-next-line
  processJson(json: object): object {
    return camelizeKeys(json);
  }
}

export class CamelToSnakeProcessor implements IJsonProcessor {
  // tslint:disable-next-line
  processJson(json: object): object {
    return decamelizeKeys(json);
  }
}

/**
 * Parses ISO dates, which are just strings in JSON. Identification based
 * on field name conventions (keys need to contain "date").
 */
export class DateConventionProcessor implements IJsonProcessor {
  private static isArray(obj): boolean {
    return Object.toString.call(obj) === '[object Array]';
  }

  private static isObject(obj): boolean {
    return obj === Object(obj);
  }

  private iso8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i;

  public processJson(json: object): object {
    this.parse(json);
    return json;
  }

  private parse(json: object) {
    if (!DateConventionProcessor.isObject(json)) {
      // abort if it's not an object
      return;
    }

    Object.keys(json).forEach(key => {
      const value: any = json[key];

      // browse arrays
      if (DateConventionProcessor.isArray(value)) {
        for (const item of value) {
          this.parse(item);
        }
        return;
      }

      // if it's a string, check for convention
      if (typeof value === 'string') {
        if (key.toLowerCase().indexOf('date') > -1) {
          // check if it's a valid ISO-8601 timestamp
          const result: boolean = this.iso8601.test(value);
          if (result) {
            // parse date (rely on date-fns)
            json[key] = parse(value); // new Date(value);
          }
        }

        // no recursion, it's a string
        return;
      }

      // recurse
      this.parse(value);
    });
  }
}
