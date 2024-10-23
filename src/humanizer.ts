import { TONBool } from "./types";

export type HumanAmount = string;
export type NativeAmount = bigint;

export type NativeBoolean = TONBool;
export type HumanBoolean = boolean;

class AmountHumanizer {
  /**
   * Convert a human-readable amount to a native amount
   * @warning this function is not for a precise conversion as
   * it uses floating point arithmetic. If you need the most precise
   * conversion, consider using BigDecimal.
   */
  fromHuman(humanAmount: HumanAmount, decimals: number): NativeAmount {
    const native = Number(humanAmount) * 10 ** decimals;

    return BigInt(native);
  }

  /**
   * Convert a native amount to a human-readable amount
   * @warning this function is not for a precise conversion as
   * it uses floating point arithmetic. If you need the most precise
   * conversion, consider using BigDecimal.
   */
  toHuman(nativeAmount: NativeAmount, decimals: number): HumanAmount {
    const humanAmount = Number(nativeAmount) / 10 ** decimals;

    return humanAmount.toString();
  }
}

class BooleanHumanizer {
  fromHuman(humanBoolean: HumanBoolean): NativeBoolean {
    return humanBoolean ? TONBool.TRUE : TONBool.FALSE;
  }

  toHuman(nativeBoolean: NativeBoolean): HumanBoolean {
    if (nativeBoolean === TONBool.TRUE) {
      return true;
    }

    return false;
  }
}

/**
 * Takes some native data and converts it to a human-readable format and vice versa
 */
export class Humanizer {
  public static amount: AmountHumanizer = new AmountHumanizer();
  public static bool: BooleanHumanizer = new BooleanHumanizer();
}
