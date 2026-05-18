export function getEntityId(obj: any): string {
  if (!obj) return '';
  if (obj._id && typeof obj._id.toString === 'function') return obj._id.toString();
  if (obj.id) return String(obj.id);
  return '';
}

export default { getEntityId };
