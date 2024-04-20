import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'util';

Object.defineProperties(global, {
  'crypto': {
    value: webcrypto,
  },
  TextDecoder: {
    value: TextDecoder,
  },
  TextEncoder: {
    value: TextEncoder,
  },
});