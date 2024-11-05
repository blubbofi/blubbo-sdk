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

  /**
   * A util function to subtract an unsigned integer from another while ensuring that the two integers are
   * greater than or equal to 0 and the result is less than or equal to `ScMath.MAX_UINT_257`
   * @param a an unsigned integer
   * @param b an unsigned integer
   * @returns a - b
   * @example
   * ```
   * ScMath.uint_add(2n, 1n); // 1n
   * ```
   */
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

  /**
   * A util function to add two unsigned integers while ensuring that the two integers are
   * greater than or equal to 0 and the result is less than or equal to `ScMath.MAX_UINT_257`
   * @param a an unsigned integer
   * @param b an unsigned integer
   * @returns a + b
   * @example
   * ```
   * ScMath.uint_add(1n, 2n); // 3n
   * ```
   */
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

  /**
   * Some variables are scaled by `ScMath.SCALE` in the smart contract
   * to maintain precision. This function is used to multiply a number with another
   * while maintaining the same unit of precision.
   * @param a An unsigned integer to be multipled by `b`
   * @param b An unsigned integer scaled by `SCALE`
   * @returns The result of the multiplication in the unit of `ScMath.SCALE`
   * @example
   * ```
   * // Notice how 1000000320586022935070387176n * 1000000000564234572341374307n will give 1000000321150257688297479032391455111470408090428687032n, but this will give 1000000321150257688297479032n, which truncates the precision.
   * const result = ScMath.uint_mul(1000000320586022935070387176n, 1000000000564234572341374307n);
   * expect(result).toBe(1000000321150257688297479032n);
   * ```
   */
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

  /**
   * Some variables are scaled by `ScMath.SCALE` in the smart contract
   * to maintain precision. This function is used to divide a number by another
   * while maintaining the precision.
   * @param a An unsigned integer to be divided
   * @param b An unsigned integer scaled by `SCALE`
   * @returns The result of the division in the unit of `ScMath.SCALE`
   * @example
   * ```
   * // Notice how 1000000320586022935070387176n / 1000000000564234572341374307n will just give 1n, but this will give 1000000320021788182161656074n, which preserves the precision.
   * const result = ScMath.uint_div(1000000320586022935070387176n, 1000000000564234572341374307n);
   * expect(result).toBe(1000000320021788182161656074n);
   * ```
   */
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

  /**
   *
   * @param pct a percentage value represented as an integer between 0n and 100n (inclusive)
   * @returns The scaled percentage value in the unit of `ScMath.SCALE` which then
   * can be used to multiply with other numbers in the unit of `ScMath.SCALE`
   * @example
   * ```
   * const scaled_pct = ScMath.uint_scale_pct(50n);
   * console.log(scaled_pct); // 500000000000000000000000000n
   */
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
