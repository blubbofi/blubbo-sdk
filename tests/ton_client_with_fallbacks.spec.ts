import { TonClient } from "@ton/ton";
import {
  BlubboMaster,
  ConstantsByDeployment,
  TonClientWithFallbacks,
} from "../src";
import { getHttpEndpoint } from "@orbs-network/ton-access";

describe(`ton_client_with_fallbacks`, () => {
  it(`should switch to fallback in case of error`, async () => {
    const tonClientWithFallbacks = new TonClientWithFallbacks(
      {
        endpoint: `https://does.not.work`,
      },
      [
        (async () => {
          const endpoint = await getHttpEndpoint({ network: `testnet` });
          return new TonClient({
            endpoint,
          });
        })(),
      ],
      {
        retryTimes: 3,
        retryIntervalMs: 2000,
      },
    );
    const blubboMaster = await tonClientWithFallbacks.openWithFallbacks(
      BlubboMaster.createFromAddress(
        ConstantsByDeployment.testnet_2024_11_01_7513aa7.AddressBook
          .BLUBBO_MASTER,
      ),
    );
    try {
      const reserve = await blubboMaster.callAsyncMethod(`getReserve`, 0n);

      console.log(reserve);
    } catch (e) {
      console.error(e);
      fail(e);
    }
  });

  it(`should switch to the last fallback in case of error`, async () => {
    const tonClientWithFallbacks = new TonClientWithFallbacks(
      {
        endpoint: `https://does.not.work`,
      },
      [
        new TonClient({
          endpoint: `https://this.one.too.does.not.work`,
        }),
        (async () => {
          const endpoint = await getHttpEndpoint({ network: `testnet` });
          return new TonClient({
            endpoint,
          });
        })(),
      ],
      {
        retryTimes: 3,
        retryIntervalMs: 2000,
      },
    );
    const blubboMaster = await tonClientWithFallbacks.openWithFallbacks(
      BlubboMaster.createFromAddress(
        ConstantsByDeployment.testnet_2024_11_01_7513aa7.AddressBook
          .BLUBBO_MASTER,
      ),
    );
    try {
      const reserve = await blubboMaster.callAsyncMethod(`getReserve`, 0n);

      console.log(reserve);
    } catch (e) {
      console.error(e);
      fail(e);
    }
  });

  it(`should fail after retrying`, async () => {
    const t0 = performance.now();
    const retryTimes = 3;
    const retryIntervalMs = 2000;
    const tonClientWithFallbacks = new TonClientWithFallbacks(
      {
        endpoint: `https://does.not.work`,
      },
      [
        new TonClient({
          endpoint: `https://this.one.too.does.not.work`,
        }),
        new TonClient({
          endpoint: `https://this.one.too.does.not.work`,
        }),
      ],
      {
        retryTimes,
        retryIntervalMs,
      },
    );
    const blubboMaster = await tonClientWithFallbacks.openWithFallbacks(
      BlubboMaster.createFromAddress(
        ConstantsByDeployment.testnet_2024_11_01_7513aa7.AddressBook
          .BLUBBO_MASTER,
      ),
    );
    try {
      const reserve = await blubboMaster.callAsyncMethod(`getReserve`, 0n);

      console.log(reserve);
    } catch (e) {
      console.error(e);

      const t1 = performance.now();
      // Pass test
      expect(t1 - t0).toBeGreaterThan(retryTimes * retryIntervalMs);
    }
  });
});
