const mockSocket = {
  setEncoding: jest.fn(),
  on: jest.fn(),
  write: jest.fn(),
  destroy: jest.fn(),
  destroyed: false,
};

export default {
  createConnection: jest.fn((_opts: any, cb: () => void) => {
    setTimeout(cb, 0);
    return mockSocket;
  }),
};
