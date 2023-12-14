const now = () => {
  const date = new Date();
  const [year, month, day, hour, minute, second] = [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  ].map((value) => value.toString().padStart(2, '0'));
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

/* eslint-disable no-console */
const info = (data: unknown) => console.log(now(), data);
const error = (data: unknown) => console.error(now(), data);
/* eslint-enable no-console */

export const logger = {
  error,
  info,
};
