import { TONBool } from "./types";

type HumanAmount = string;
type NativeAmount = bigint;

type NativeBoolean = TONBool;
type HumanBoolean = boolean;

/**
 * Takes some native data and converts it to a human-readable format and vice versa
 */
export class Humanizer {
  constructor(
    public amount: AmountHumanizer,
    public bool: BooleanHumanizer,
  ) {}
}

class AmountHumanizer {
  /**
   * Convert a human-readable amount to a native amount
   * @warning this function is not for a precise conversion as
   * it uses floating point arithmetic. If you need the most precise
   * conversion, consider using BigDecimal.
   */
  static fromHuman(humanAmount: HumanAmount, decimals: number): NativeAmount {
    const native = Number(humanAmount) * 10 ** decimals;

    return BigInt(native);
  }

  /**
   * Convert a native amount to a human-readable amount
   * @warning this function is not for a precise conversion as
   * it uses floating point arithmetic. If you need the most precise
   * conversion, consider using BigDecimal.
   */
  static toHuman(nativeAmount: NativeAmount, decimals: number): HumanAmount {
    const humanAmount = Number(nativeAmount) / 10 ** decimals;

    return humanAmount.toString();
  }
}

class BooleanHumanizer {
  static fromHuman(humanBoolean: HumanBoolean): NativeBoolean {
    return humanBoolean ? TONBool.TRUE : TONBool.FALSE;
  }

  static toHuman(nativeBoolean: NativeBoolean): HumanBoolean {
    if (nativeBoolean === TONBool.TRUE) {
      return true;
    }

    return false;
  }
}
