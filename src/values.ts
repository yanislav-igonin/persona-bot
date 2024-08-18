export const valueOrNull = (value: string | undefined) => value ?? null;
export const valueOrDefault = <T>(value: T | undefined, defaultValue: T) =>
  value ?? defaultValue;
export const valueOrThrow = <T>(value: T | undefined, key: string) => {
  if (!value) {
    throw new Error(`key ${key} is not defined`);
  }

  return value;
};
