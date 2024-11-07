import { ScMath } from "../src";

describe(`ScMath`, () => {
  it(`uint_div`, () => {
    // Notice how 1000000320586022935070387176n / 1000000000564234572341374307n will just give 1n, but this will give 1000000320021788182161656074n, which preserves the precision.
    const result = ScMath.uint_div(
      1000000320586022935070387176n,
      1000000000564234572341374307n,
    );
    expect(result).toBe(1000000320021788182161656074n);
  });

  it(`uint_div 2`, () => {
    const result = ScMath.uint_div(159n, 1000000000564234572341374307n);
    expect(result).toBe(158n);
  });

  it(`uint_mul`, () => {
    // Notice how 1000000320586022935070387176n * 1000000000564234572341374307n will give 1000000321150257688297479032391455111470408090428687032n, but this will give 1000000321150257688297479032n, which truncates the precision.
    const result = ScMath.uint_mul(
      1000000320586022935070387176n,
      1000000000564234572341374307n,
    );
    expect(result).toBe(1000000321150257688297479032n);
  });
});
