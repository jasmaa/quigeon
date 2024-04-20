import { describe, expect, it } from "@jest/globals";
import { validateCollectionName, validateRequestName } from "./validators";

describe('test validateCollectionName', () => {
  it.each([
    'a',
    'aa',
    'My Stuff',
    'My_Stuff',
    'MyStuff1',
    '__MyStuff2__',
  ])('should allow name="%s"', (name) => {
    expect(validateCollectionName(name)).toBeTruthy();
  });

  it.each([
    '',
    'tooloooooooooooooooooooooong',
    '$$$',
    '!MyStuff',
    '私のもの',
    '     ',
    '  abc  '
  ])('should reject name="%s"', (name) => {
    expect(validateCollectionName(name)).toBeFalsy();
  });
});

describe('test validateRequestName', () => {
  it.each([
    'a',
    'aa',
    'My Stuff',
    'My_Stuff',
    'MyStuff1',
    '__MyStuff2__',
  ])('should allow name="%s"', (name) => {
    expect(validateRequestName(name)).toBeTruthy();
  });

  it.each([
    '',
    'tooloooooooooooooooooooooong',
    '$$$',
    '!MyStuff',
    '私のもの',
    '     ',
    '  abc  '
  ])('should reject name="%s"', (name) => {
    expect(validateRequestName(name)).toBeFalsy();
  });
});