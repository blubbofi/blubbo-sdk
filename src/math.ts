import { assert } from "./utils";

/**
 * This class emulates the functions in math.fc in the smart contract
 */
export class ScMath {
  public static SCALE = 1000000000000000000000000000n;
  public static SECONDS_PER_YEAR = 31536000n;
  /**
   * The maximum value that can be represented by a uint257 (max int value in func)
   */
  public static MAX_UINT_257 = 2n ** 257n - 1n;

  static uint_sub(a: bigint, b: bigint): bigint {
    assert(a >= 0, "a must be gte 0");
    assert(b >= 0, "b must be gte 0");

    const result = a - b;

    assert(result >= 0, "result must be gte 0");

    assert(
      result <= this.MAX_UINT_257,
      "result must be less than or equal to MAX_UINT_257",
    );

    return result;
  }

  static uint_add(a: bigint, b: bigint): bigint {
    assert(a >= 0, "a must be gte 0");
    assert(b >= 0, "b must be gte 0");

    const result = a + b;

    assert(
      result <= this.MAX_UINT_257,
      "result must be less than or equal to MAX_UINT_257",
    );

    return result;
  }

  // This function assumes `b` is scaled by `SCALE`
  static uint_mul(a: bigint, b: bigint): bigint {
    assert(a >= 0, "a must be gte 0");
    assert(b >= 0, "b must be gte 0");

    const scaled_product = a * b;

    const result = scaled_product / this.SCALE;

    assert(
      result <= this.MAX_UINT_257,
      "result must be less than or equal to MAX_UINT_257",
    );

    return result;
  }

  // This function assumes `b` is scaled by `SCALE`
  static uint_div(a: bigint, b: bigint): bigint {
    assert(a >= 0, "a must be gte 0");
    assert(b > 0, "b must be greater than 0");

    const scaled_product = a * this.SCALE;

    const result = scaled_product / b;

    assert(
      result <= this.MAX_UINT_257,
      "result must be less than or equal to MAX_UINT_257",
    );

    return result;
  }

  static uint_scale_pct(pct: bigint) {
    assert(pct >= 0, "pct must be gte 0");
    assert(pct <= 100, "pct must be less than or equal to 100");

    return (pct * this.SCALE) / 100n;
  }

  // This function assumes `b` is scaled by `10 ^ b_decimals`
  static uint_mul_decimals(a: bigint, b: bigint, b_decimals: bigint): bigint {
    assert(a >= 0, "a must be gte 0");
    assert(b >= 0, "b must be gte 0");
    assert(b_decimals >= 0, "b_decimals must be gte 0");

    const scale = 10n ** b_decimals;
    const scaled_product = a * b;

    const result = scaled_product / scale;

    assert(
      result <= this.MAX_UINT_257,
      "result must be less than or equal to MAX_UINT_257",
    );

    return result;
  }

  // This function assumes `b` is scaled by `10 ^ b_decimals`
  static uint_div_decimals(a: bigint, b: bigint, b_decimals: bigint): bigint {
    assert(a >= 0, "a must be gte 0");
    assert(b > 0, "b must be greater than 0");
    assert(b_decimals >= 0, "b_decimals must be gte 0");

    const scale = 10n ** b_decimals;
    const scaled_product = a * scale;

    const result = scaled_product / b;

    assert(
      result <= this.MAX_UINT_257,
      "result must be less than or equal to MAX_UINT_257",
    );

    return result;
  }
}
