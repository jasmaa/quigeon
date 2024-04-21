import { Crypto } from "@peculiar/webcrypto";
import { TextEncoder, TextDecoder } from 'fastestsmallesttextencoderdecoder';

Object.defineProperties(global, {
  'crypto': {
    value: new Crypto(),
  },
  TextDecoder: {
    value: TextDecoder,
  },
  TextEncoder: {
    value: TextEncoder,
  },
});