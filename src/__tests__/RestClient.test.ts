import { RestClient } from "../index";

describe("RestClient", () => {
  test("Initializes baseUri correctly ", () => {
    const restClient = new RestClient("baseUri");
    expect(restClient.baseUri).toBe("baseUri");
  });
});
