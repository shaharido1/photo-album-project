// Mock Konva module for Jest
/// <reference types="jest" />

const Konva = {
  Stage: jest.fn(),
  Layer: jest.fn(),
  Rect: jest.fn(),
  Circle: jest.fn(),
  Line: jest.fn(),
  Text: jest.fn(),
  Image: jest.fn(),
  Group: jest.fn(),
  Transformer: jest.fn(),
  Node: jest.fn(),
  Shape: jest.fn(),
  Container: jest.fn(),
  isBrowser: true,
  isUnminified: false,
  version: '9.0.0',
  Util: {
    _isElement: jest.fn(),
    _isFunction: jest.fn(),
    _isPlainObject: jest.fn(),
    _isArray: jest.fn(),
    _isNumber: jest.fn(),
    _isString: jest.fn(),
    _isBoolean: jest.fn(),
  },
};

export default Konva;
