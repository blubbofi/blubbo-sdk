import { Dirm, ReserveVars3, ScMath } from "../src";

describe("dirm", () => {
  it(`calculates utilization rate`, () => {
    const totalAvailable = 100n;
    const totalDebt = 50n;
    // total available = 100 + 50 = 150
    // total debt / total liquidity = 50 / 150 = 1/3
    const utilizationRate = Dirm.calculate_utilization_rate(
      totalAvailable,
      totalDebt,
    );
    console.log(utilizationRate);
    expect(utilizationRate).toBe(ScMath.SCALE / 3n);
  });

  it(`calculates rates`, () => {
    const reserve_vars_3: ReserveVars3 = {
      slope0_pct: 50n,
      slope1_pct: 80n,
      y_intercept: 0n,
      optimal_rate_pct: 90n,
    };
    const totalAvailable = 100n;
    const totalDebt = 50n;

    const { lending_rate, borrowing_rate } = Dirm.get_interest_rates(
      reserve_vars_3,
      totalAvailable,
      totalDebt,
    );
    console.log({
      lending_rate,
      borrowing_rate,
    });
    expect(lending_rate).toBe(61728395061728395061728394n);
    expect(borrowing_rate).toBe(185185185185185185185185185n);
  });
});
