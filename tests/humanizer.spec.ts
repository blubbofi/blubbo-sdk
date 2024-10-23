import { Humanizer } from "../src/humanizer";

describe("Humanizer", () => {
  const conversions = [
    ["1.142421", 1142421000000000000000000000n, false],
    ["0", 0n, false],
    ["0.00", 0n, true],
    [
      "123124124124124124125215125.113",
      123124124124124124125215125113000000000000000000000000n,
      false,
    ],
    ["1.231241241241241241252151258", 1231241241241241241252151258n, false],
    // 27 decimals
    ["0.000000000000000000000000001", 1n, false],
    ["1.17156945852137946704172", 1171569458521379467041720000n, false],
  ] as [string, bigint, boolean][];

  const swap = (arr: [string, bigint, boolean]) =>
    [arr[1], arr[0], arr[2]] as [bigint, string, boolean];

  it.each(conversions)(
    `scaled number humanizer: convert %p to %p`,
    async (human, expectedNative) => {
      const native = Humanizer.scaledNumber.fromHuman(human);

      expect(native).toBe(expectedNative);
    },
  );

  it.each(conversions.map(swap))(
    `scaled number humanizer: convert %p to %p`,
    async (native, expectedHuman, skipTest) => {
      if (skipTest) {
        return;
      }

      const human = Humanizer.scaledNumber.toHuman(native);

      expect(human).toBe(expectedHuman);
    },
  );

  const bigDecimalsConversions = [
    ["1142421", 1142421n * 10n ** 50n, 50],
    ["114.2421", 1142421n * 10n ** 46n, 50],
    ["0.000000000000000000000000000000000000000000000000000000012", 12n, 57],
  ] as [string, bigint, number][];

  const swapBigDecimals = (arr: [string, bigint, number]) =>
    [arr[1], arr[0], arr[2]] as [bigint, string, number];

  it.each(bigDecimalsConversions)(
    `genericNumber humanizer: convert %p to %p`,
    async (human, expectedNative, decimals) => {
      const native = Humanizer.genericNumber.fromHuman(human, decimals);

      expect(native).toBe(expectedNative);
    },
  );

  it.each(bigDecimalsConversions.map(swapBigDecimals))(
    `genericNumber humanizer: convert %p to %p`,
    async (native, expectedHuman, decimals) => {
      const human = Humanizer.genericNumber.toHuman(native, decimals);

      expect(human).toBe(expectedHuman);
    },
  );
});
