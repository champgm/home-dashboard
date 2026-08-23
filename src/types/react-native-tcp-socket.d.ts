declare module "react-native-tcp-socket" {
  interface TcpSocket {
    on(event: string, listener: (...args: any[]) => void): void;
    connect(options: { host: string; port: number }, callback?: () => void): void;
    write(data: Uint8Array | string): void;
    destroy(): void;
  }

  const TcpSocket: {
    createConnection(options: object, callback?: () => void): TcpSocket;
  };

  export default TcpSocket;
}
