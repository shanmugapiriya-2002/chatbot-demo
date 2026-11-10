import { describe, test, expect } from "vitest";
import { sum } from "../utils/sum";

describe("Sum Function Testing", () => {

  test("2 + 3 should equal 5", () => {
    expect(sum(2, 3)).toBe(5);
  });

 

  test("0 + 5 should equal 5", () => {
    expect(sum(0, 5)).toBe(5);
  });

});