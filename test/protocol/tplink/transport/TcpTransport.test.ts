import { PlugEndpoint } from "../../../../src/app/types";
import {
  DEFAULT_NATIVE_CONNECT_TIMEOUT_MS,
  ReactNativeTcpTransport,
  TcpSocketFactory,
  TcpSocketLike,
} from "../../../../src/protocol/tplink/TcpTransport";

const endpoint: PlugEndpoint = { id: "plug", ipv4: "192.168.2.226", port: 9999 };

describe("React Native TP-Link TCP transport", () => {
  test("passes a finite connect timeout to the native socket", async () => {
    let factoryTimeout: number | undefined;
    let connectOptions: { host: string; port: number; connectTimeout?: number } | undefined;
    const factory: TcpSocketFactory = (_endpoint, callbacks, connectTimeoutMs) => {
      factoryTimeout = connectTimeoutMs;
      const socket: TcpSocketLike = {
        on: () => undefined,
        connect: (options) => {
          connectOptions = options;
          queueMicrotask(() => callbacks.onError(new Error("offline")));
        },
        write: () => undefined,
        destroy: () => undefined,
      };
      return socket;
    };
    const transport = new ReactNativeTcpTransport(factory);

    await expect(transport.send(endpoint, new Uint8Array([0]), 5000, false)).rejects.toMatchObject({
      category: "NetworkUnavailable",
      possibleSend: false,
    });
    expect(factoryTimeout).toBe(DEFAULT_NATIVE_CONNECT_TIMEOUT_MS);
    expect(connectOptions).toEqual({
      host: endpoint.ipv4,
      port: endpoint.port,
      connectTimeout: DEFAULT_NATIVE_CONNECT_TIMEOUT_MS,
    });
  });
});
