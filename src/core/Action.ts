import chunk from 'lodash/chunk';
import uniqBy from 'lodash/uniqBy';
import uniqWith from 'lodash/uniqWith';
import { pickArrayOfObject } from '../utils';
import supabase from '../lib/supabase';
import { Keys } from '../types/utils';

export type InsertAction<T, K> = {
  table: string;
  transform?: (data: T[]) => K[];
  keys: Keys<K>;
  uniqueKey?: keyof K | Keys<K>;
  onDone?: (data: K[]) => any;
  upsertOptions?: UpsertOptions;
};

export type UpsertOptions = {
  onConflict?: string;
  returning?: 'minimal' | 'representation';
  count?: 'exact' | 'planned' | 'estimated';
  ignoreDuplicates?: boolean;
};

// Type helper
export const createAction = <T, K = T>(properties: InsertAction<T, K>) =>
  properties;

export const insertData = async <T>(
  data: T[],
  actions: InsertAction<T, any>[],
  transformUniqueKey?: keyof T,
) => {
  const defaultTransform = (data: T[]) => data as any[];

  for (const action of actions) {
    const {
      table,
      transform = defaultTransform,
      keys,
      uniqueKey,
      onDone,
      upsertOptions = {},
    } = action;

    const transformedData = transform(uniqBy(data, transformUniqueKey));
    let pickedData = pickArrayOfObject(transformedData, keys);

    if (Array.isArray(uniqueKey)) {
      pickedData = uniqWith(pickedData, (a, b) =>
        uniqueKey.every((key: string) => a[key] === b[key]),
      );
    } else if (uniqueKey) {
      pickedData = uniqBy(pickedData, uniqueKey);
    }

    if (!pickedData.length) continue;

    const chunkedData = chunk(pickedData, 3000);

    let chunkNumber = 1;
    const totalReturnedData = [];

    for (const chunk of chunkedData) {
      console.log(`INSERT ${table}: ${chunkNumber} (${chunk.length})`);

      const { data, error } = await supabase
        .from('kaguya_' + table)
        .upsert(chunk, {
          returning: 'minimal',
          ...upsertOptions,
        });

      if (error) {
        console.log(error);

        throw error;
      }

      totalReturnedData.push(data);

      chunkNumber++;
    }

    onDone?.(totalReturnedData.flat());
    console.log('INSERTED TABLE ' + table);
  }

  return true;
};
