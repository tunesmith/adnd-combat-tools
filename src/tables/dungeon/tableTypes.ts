type Range = [number, ...number[]];

export type Entry<T> = {
  range: Range;
  command: T;
};

export type Table<T> = {
  sides: number;
  entries: [Entry<T>, ...Entry<T>[]];
};
