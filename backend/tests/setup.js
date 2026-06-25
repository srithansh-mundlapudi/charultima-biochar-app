// Suppress console.log during tests
global.console.log = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();