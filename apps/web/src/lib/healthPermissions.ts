/**
 * capacitor-health's PermissionResponse is typed as `{ [perm]: boolean }[]`, but on
 * Android the plugin returns one object `{ READ_STEPS: true, ... }`. Calling `.some` on
 * that threw, the caller swallowed it, and the watch sync silently read nothing since
 * the first Android build. Accept both shapes.
 */
export function anyGranted(permissions: unknown): boolean {
  const entries = Array.isArray(permissions) ? permissions : [permissions]
  return entries.some(
    (entry) => typeof entry === 'object' && entry !== null && Object.values(entry).some((v) => v === true),
  )
}
