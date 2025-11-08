// 定义序列化后的 Map 结构类型
interface SerializedMap {
  __type: 'Map';
  data: [any, any][];
}

/**
 * 通用 Map 序列化函数：将任何包含 Map 的数据结构转换为 JSON 字符串。
 * 它通过添加特殊的 "__type": "Map" 标记来保留 Map 结构。
 * * @param data 任何包含 Map 的 JavaScript 值。
 * @returns 包含 Map 信息的 JSON 字符串。
 */
export function mapStringify(data: any): string {
  return JSON.stringify(data, (_, value) => {
    // 遇到 Map 实例时，将其转换为一个带有类型标记的普通对象。
    if (value instanceof Map) {
      return {
        __type: 'Map',
        // Map 的键值对被转换为数组：[[key1, value1], [key2, value2], ...]
        data: Array.from(value.entries()) as [any, any][],
      } as SerializedMap;
    }
    return value;
  });
}

/**
 * 通用 Map 反序列化函数：将 JSON 字符串转换回原始数据结构（并重建 Map）。
 * 特别处理：当遇到 Map 的数据数组时，尝试将键（key）从字符串恢复为数字。
 * * @param jsonString mapStringify 生成的 JSON 字符串。
 * @returns 重建了所有 Map 实例的 JavaScript 值。
 */
export function mapParse<T>(jsonString: string): T {
  // 递归地使用 reviver 函数处理解析后的数据
  return JSON.parse(jsonString, (_, value) => {
    // 1. 检查是否是 Map 的数据结构标记
    if (typeof value === 'object' && value !== null && value.__type === 'Map') {
      const serializedMap = value as SerializedMap;

      // 2. 遍历数据数组，恢复数字键
      const entries = serializedMap.data.map(([k, v]) => {
        // 检查键是否是字符串，并且可以安全地转换为数字
        if (typeof k === 'string' && !isNaN(Number(k))) {
          // 检查转换回来的数字是否和原字符串等价（排除 "01" 这种被转换为 1 的情况，保持原样）
          if (String(Number(k)) === k) {
            return [Number(k), v]; // 转换回数字键
          }
        }
        // 否则保持原样 (如非字符串键、不能转为数字的字符串键、或键为 null/object)
        return [k, v];
      });

      // 3. 使用恢复后的键值对重建 Map 实例
      return new Map(entries as Iterable<[any, any]>);
    }

    // 4. 返回其他值，继续正常的 JSON.parse 过程
    return value;
  }) as T;
}
