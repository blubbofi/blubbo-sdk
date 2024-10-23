import { TONBool } from "./types";
import BigNumber from "bignumber.js";

export type HumanAmount = string;
export type NativeAmount = bigint;

export type NativeBoolean = TONBool;
export type HumanBoolean = boolean;

/**
 * Takes some native amount and converts it to a human-readable format and vice versa
 */
class GenericNumberHumanizer {
  /**
   * Convert a human-readable amount to a native amount
   * @example fromHuman("114.2421", 50) => 1142421n * 10n ** 46n
   * @example fromHuman("0.000000000000000000000000000000000000000000000000000000012", 57) => 12n
   */
  fromHuman(humanAmount: HumanAmount, decimals: number): NativeAmount {
    if (decimals < 0) {
      throw new Error("Decimals must be a non-negative number");
    }
    // Default decimal places is 20 in BigNumber.js, but we have
    // use cases where we need more precision
    const BN = BigNumber.clone({ DECIMAL_PLACES: decimals });
    const scale = new BN(`10`).pow(decimals);
    // humanAmount * 10 ** decimals;
    const native = new BN(humanAmount).multipliedBy(scale).toString(16);

    return BigInt("0x" + native);
  }

  /**
   * Convert a native amount to a human-readable amount
   * @example toHuman(1142421n * 10n ** 50n, 50) => "1142421"
   * @example toHuman(12n, 57) => "0.000000000000000000000000000000000000000000000000000000012"
   */
  toHuman(nativeAmount: NativeAmount, decimals: number): HumanAmount {
    if (decimals < 0) {
      throw new Error("Decimals must be a non-negative number");
    }
    // Default decimal places is 20 in BigNumber.js, but we have
    // use cases where we need more precision
    const BN = BigNumber.clone({ DECIMAL_PLACES: decimals });
    const scale = new BN(`10`).pow(decimals);
    const native = new BN("0x" + nativeAmount.toString(16));
    const human = native.dividedBy(scale);

    return this.cutoutRightZeros(human.toFixed(decimals));
  }

  cutoutRightZeros(humanAmount: HumanAmount): HumanAmount {
    return humanAmount.replace(/(\.0+|0+)$/, "");
  }
}

/**
 * In BeachFi, we use 10**27 as a scaling factor for some numbers.
 * This class helps to convert those numbers.
 */
class ScaledNumberHumanizer {
  genericNumber: GenericNumberHumanizer = new GenericNumberHumanizer();

  /**
   * Convert a human-readable amount to a native amount.
   * Equivalent to `new GenericNumberHumanizer().fromHuman(humanAmount, 27)`
   *
   * @example fromHuman("1.17156945852137946704172") => 1171569458521379467041720000n
   */
  fromHuman(humanAmount: HumanAmount): NativeAmount {
    return this.genericNumber.fromHuman(humanAmount, 27);
  }

  /**
   * Convert a native amount to a human-readable amount
   * Equivalent to `new GenericNumberHumanizer().toHuman(nativeAmount, 27)`
   *
   * @example toHuman(1171569458521379467041720000n) => "1.17156945852137946704172"
   */
  toHuman(nativeAmount: NativeAmount): HumanAmount {
    return this.genericNumber.toHuman(nativeAmount, 27);
  }
}

/**
 * TON uses -1n for true and 0n for false. This class helps to convert those numbers
 * into human-friendly JavaScript booleans and vice versa
 */
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
  public static bool: BooleanHumanizer = new BooleanHumanizer();
  public static genericNumber: GenericNumberHumanizer =
    new GenericNumberHumanizer();
  public static scaledNumber: ScaledNumberHumanizer =
    new ScaledNumberHumanizer();
}
