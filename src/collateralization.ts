export type CollateralInfo = {
  /**
   * an integer representing the native amount.
   * @example if an asset has 9 decimals and the amount is 1.23, this should be 1230000000n
   */
  nativeAmount: bigint;
  /**
   * an integer representing the number of decimals of the native amount.
   * @example if an asset has 9 decimals, this should be 9n
   */
  nativeDecimals: bigint;
  /**
   * The collateral factor of a reserve in percentage.
   * @description should be 0n <= collateralFactorPct <= 100n
   */
  collateralFactorPct: bigint;
  /**
   * an integer representing the price with 8 decimals.
   * @example 1.23 => 123000000n
   */
  price8Decimals: bigint;
};

export type DebtInfo = {
  /**
   * an integer representing the native amount.
   * @example if an asset has 9 decimals and the amount is 1.23, this should be 1230000000n
   */
  nativeAmount: bigint;
  /**
   * an integer representing the number of decimals of the native amount.
   * @example if an asset has 9 decimals, this should be 9n
   */
  nativeDecimals: bigint;
  /**
   * The borrow factor of a reserve in percentage.
   * zero if you don't want to apply borrow factor
   * @description should be 0n <= borrowFactorPct <= 100n
   */
  borrowFactorPct: bigint;
  /**
   * an integer representing the price with 8 decimals.
   * @example 1.23 => 123000000n
   */
  price8Decimals: bigint;
};

/**
 * @warning DO NOT use this class yet, it's not ready yet.
 * It needs unit tests.
 */
export class Collateralization {
  discountedCollateralUsd = 0n;
  debtUsd = 0n;

  /**
   * TODO: support assets of different decimal places
   */
  calcCollateral({
    nativeAmount,
    nativeDecimals,
    collateralFactorPct,
    price8Decimals,
  }: CollateralInfo) {
    // face_deposit_a = 100_000000000n (100 A)
    // usd_face_deposit_a = ((100_000000000n * medianPricesArr[0]) / 10n**9n)
    // discounted_usd_face_deposit_a = ((usd_face_deposit_a) * (50n * 1000000000000000000000000000n / 100n)) / 1000000000000000000000000000n
    const usdAmount = (nativeAmount * price8Decimals) / 10n ** nativeDecimals;

    const discountedUsdAmount =
      (usdAmount * ((collateralFactorPct * 10n ** 27n) / 100n)) / 10n ** 27n;

    return discountedUsdAmount;
  }

  addCollateral({
    nativeAmount,
    nativeDecimals,
    collateralFactorPct,
    price8Decimals,
  }: CollateralInfo) {
    const discountedUsdAmount = this.calcCollateral({
      nativeAmount,
      nativeDecimals,
      collateralFactorPct,
      price8Decimals,
    });

    this.discountedCollateralUsd += discountedUsdAmount;

    return discountedUsdAmount;
  }

  calcDebt({
    nativeAmount,
    nativeDecimals,
    borrowFactorPct,
    price8Decimals,
  }: DebtInfo) {
    // face_debt_b = whatever
    // usd_face_debt_b = ((face_debt_b * medianPricesArr[1]) / 10n**9n)
    // exaggerated_usd_face_debt_b = ((usd_face_debt_b * 1000000000000000000000000000n) / (90n * 1000000000000000000000000000n / 100n))
    const usdAmount = (nativeAmount * price8Decimals) / 10n ** nativeDecimals;

    // Don't apply borrow factor
    if (borrowFactorPct === 0n) {
      return usdAmount;
    }
    const exaggeratedUsdAmount =
      (usdAmount * 10n ** 27n) / ((borrowFactorPct * 10n ** 27n) / 100n);

    return exaggeratedUsdAmount;
  }
  addDebt({
    nativeAmount,
    nativeDecimals,
    borrowFactorPct,
    price8Decimals,
  }: DebtInfo) {
    const usdAmount = this.calcDebt({
      nativeAmount,
      nativeDecimals,
      borrowFactorPct,
      price8Decimals,
    });

    this.debtUsd += usdAmount;

    return usdAmount;
  }

  /**
   * - (Collateral A + Collateral B) / (Debt A + Debt B) >= 1
   * - => (Collateral A + Collateral B) >= (Debt A + Debt B)
   * - => (Collateral A + Collateral B) - Debt A >= Debt B
   * - Debt B = native amount * price / borrow factor
   * - => ((Collateral A + Collateral B) - Debt A) * borrow factor / price >= native amount
   */
  calcMaxBorrowCapacity({
    collaterals,
    otherDebts,
    calcMaxBorrowCapacityForDebt,
  }: {
    collaterals: CollateralInfo[];
    otherDebts: DebtInfo[];
    calcMaxBorrowCapacityForDebt: Omit<DebtInfo, "nativeAmount">;
  }) {
    const totalDiscountedCollateralsUsd = collaterals.reduce(
      (acc, collateral) => {
        return acc + this.calcCollateral(collateral);
      },
      0n,
    );
    const totalOtherDebtsUsd = otherDebts.reduce((acc, debt) => {
      return acc + this.calcDebt(debt);
    }, 0n);
    const borrowFactorPctScaledUp =
      (calcMaxBorrowCapacityForDebt.borrowFactorPct * 10n ** 27n) / 100n;
    const nativeAmount =
      ((((totalDiscountedCollateralsUsd - totalOtherDebtsUsd) *
        borrowFactorPctScaledUp) /
        10n ** 27n) *
        // TODO is this right?
        10n ** 9n) / // To remove the decimals of the price and get the native amount
      calcMaxBorrowCapacityForDebt.price8Decimals;

    return nativeAmount;
  }

  calcCollateralizationRatioData({
    collaterals,
    debts,
  }: {
    collaterals: CollateralInfo[];
    debts: DebtInfo[];
  }) {
    const totalDiscountedCollateralsUsd = collaterals.reduce(
      (acc, collateral) => {
        return acc + this.calcCollateral(collateral);
      },
      0n,
    );
    const totalOtherDebtsUsd = debts.reduce((acc, debt) => {
      return acc + this.calcDebt(debt);
    }, 0n);

    return {
      collateralsSupplied: totalDiscountedCollateralsUsd,
      collateralsRequired: totalOtherDebtsUsd,
    };
  }

  get collateralizationRatio() {
    return Number(this.discountedCollateralUsd) / Number(this.debtUsd);
  }
}
