import { camelizeKeys, decamelizeKeys } from 'humps';
import parse from 'date-fns/parse';

export interface JsonProcessor {
  processJson(json: object): object;
}

export class SnakeToCamelProcessor implements JsonProcessor {
  processJson(json: object): object {
    return camelizeKeys(json);
  }
}

export class CamelToSnakeProcessor implements JsonProcessor {
  processJson(json: object): object {
    return decamelizeKeys(json);
  }
}

/**
 * Parses ISO dates, which are just strings in JSON. Identification based
 * on field name conventions (keys need to contain "date").
 */
export class DateConventionProcessor implements JsonProcessor {
  private iso8601 = /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i;

  processJson(json: object): object {
    this.parse(json);
    return json;
  }

  private parse(json: object) {
    const self = this;

    if (!DateConventionProcessor.isObject(json)) {
      //abort if it's not an object
      return;
    }

    Object.keys(json).forEach(function(key) {
      const value: any = json[key];

      //browse arrays
      if (DateConventionProcessor.isArray(value)) {
        for (const item of value) {
          self.parse(item);
        }
        return;
      }

      //if it's a string, check for convention
      if (typeof value === 'string') {
        if (key.toLowerCase().indexOf('date') > -1) {
          //check if it's a valid ISO-8601 timestamp
          const result: boolean = self.iso8601.test(value);
          if (result) {
            //parse date (rely on date-fns)
            json[key] = parse(value); // new Date(value);
          }
        }

        //no recursion, it's a string
        return;
      }

      //recurse
      self.parse(value);
    });
  }

  private static isArray(obj): boolean {
    return Object.toString.call(obj) == '[object Array]';
  }

  private static isObject(obj): boolean {
    return obj === Object(obj);
  }
}
