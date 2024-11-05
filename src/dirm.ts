import { ScMath } from "./math";
import { ReserveVars3 } from "./types";

/**
 * Off-chain representation of the default interest rate model used in the protocol.
 */
export class Dirm {
  /**
   * Calculates the utilization rate in the unit of `ScMath.SCALE`.
   * `ScMath.SCALE` = 100%.
   * @example
   * const totalAvailable = 100n;
   * const totalDebt = 50n;
   * // total available = 100 + 50 = 150
   * // total debt / total liquidity = 50 / 150 = 1/3
   * const utilizationRate = Dirm.calculate_utilization_rate(totalAvailable, totalDebt);
   * console.log(utilizationRate) // 333333333333333333333333333n
   */
  static calculate_utilization_rate(
    face_value_total_available: bigint,
    face_value_total_debt: bigint,
  ) {
    const face_value_total_available_uint256 = BigInt.asUintN(
      256,
      face_value_total_available,
    );
    const face_value_total_debt_uint256 = BigInt.asUintN(
      256,
      face_value_total_debt,
    );
    if (face_value_total_debt === 0n) {
      return 0n;
    } else {
      const total_liquidity = ScMath.uint_add(
        face_value_total_available_uint256,
        face_value_total_debt_uint256,
      );
      const utilization_rate = ScMath.uint_div(
        face_value_total_debt_uint256,
        total_liquidity,
      );
      return utilization_rate;
    }
  }

  /**
   * For optimization purposes, the contract stores the interest rate model as 8-bits-long integers instead of storing them as 256-bits-long integers. This function scales the numbers to 256-bits-long integers.
   * @param reserve_vars_3 ReserveVars3 from the contract storage.
   * @returns the scaled numbers of the interest rate model.
   */
  static get_interest_rate_model_scaled(reserve_vars_3: ReserveVars3) {
    const { slope0_pct, slope1_pct, y_intercept, optimal_rate_pct } =
      reserve_vars_3;
    const slope0_pct_uint8 = BigInt.asUintN(8, slope0_pct);
    const slope1_pct_uint8 = BigInt.asUintN(8, slope1_pct);
    const y_intercept_uint8 = BigInt.asUintN(8, y_intercept);
    const optimal_rate_pct_uint8 = BigInt.asUintN(8, optimal_rate_pct);

    return {
      slope0_pct_scaled: ScMath.uint_scale_pct(slope0_pct_uint8),
      slope1_pct_scaled: ScMath.uint_scale_pct(slope1_pct_uint8),
      y_intercept_scaled: ScMath.uint_scale_pct(y_intercept_uint8),
      optimal_rate_pct_scaled: ScMath.uint_scale_pct(optimal_rate_pct_uint8),
    };
  }

  /**
   *
   * @param reserve_vars_3 ReserveVars3 from the contract storage.
   * @param utilization_rate The calculated utilization rate from `calculate_utilization_rate`.
   * @returns The borrowing rate in the unit of `ScMath.SCALE`.
   */
  static calculate_borrow_rate(
    reserve_vars_3: ReserveVars3,
    utilization_rate: bigint,
  ) {
    const {
      slope0_pct_scaled,
      slope1_pct_scaled,
      y_intercept_scaled,
      optimal_rate_pct_scaled,
    } = this.get_interest_rate_model_scaled(reserve_vars_3);

    if (utilization_rate <= optimal_rate_pct_scaled) {
      const temp_1 = ScMath.uint_div(utilization_rate, optimal_rate_pct_scaled);
      const temp_2 = ScMath.uint_mul(slope0_pct_scaled, temp_1);

      return ScMath.uint_add(y_intercept_scaled, temp_2);
    } else {
      const excess_utilization_rate = ScMath.uint_sub(
        utilization_rate,
        optimal_rate_pct_scaled,
      );
      const optimal_to_one = ScMath.SCALE - optimal_rate_pct_scaled;

      const temp_1 = ScMath.uint_div(excess_utilization_rate, optimal_to_one);
      const temp_2 = ScMath.uint_mul(slope1_pct_scaled, temp_1);
      const temp_3 = ScMath.uint_add(y_intercept_scaled, slope0_pct_scaled);

      return ScMath.uint_add(temp_2, temp_3);
    }
  }

  /**
   * @param reserve_vars_3 ReserveVars3 from the contract storage.
   * @param face_value_total_available The available liquidity in the reserve.
   * @param face_value_total_debt The total debt in the reserve.
   * @returns The lending rate and borrowing rate in 128-bits-long integers.
   */
  static get_interest_rates(
    reserve_vars_3: ReserveVars3,
    face_value_total_available: bigint,
    face_value_total_debt: bigint,
  ) {
    const face_value_total_available_uint256 = BigInt.asUintN(
      256,
      face_value_total_available,
    );
    const face_value_total_debt_uint256 = BigInt.asUintN(
      256,
      face_value_total_debt,
    );
    const utilization_rate = this.calculate_utilization_rate(
      face_value_total_available_uint256,
      face_value_total_debt_uint256,
    );

    if (utilization_rate === 0n) {
      return { lending_rate: 0n, borrowing_rate: 0n };
    } else {
      const borrowing_rate = this.calculate_borrow_rate(
        reserve_vars_3,
        utilization_rate,
      );
      const lending_rate = ScMath.uint_mul(borrowing_rate, utilization_rate);
      const borrowing_rate_uint_128 = BigInt.asUintN(128, borrowing_rate);
      const lending_rate_uint_128 = BigInt.asUintN(128, lending_rate);
      return {
        lending_rate: lending_rate_uint_128,
        borrowing_rate: borrowing_rate_uint_128,
      };
    }
  }
}
