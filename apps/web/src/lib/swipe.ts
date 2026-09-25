/** Distance (px) a row must travel before a swipe counts. */
export const SWIPE_THRESHOLD = 80

export type SwipeAction = 'edit' | 'delete'

/**
 * Right = edit, left = delete. A mostly vertical drag is the list scrolling,
 * never an action -- a stray delete while scrolling is the failure to avoid.
 */
export function swipeAction(dx: number, dy: number): SwipeAction | null {
  if (Math.abs(dy) >= Math.abs(dx)) return null
  if (dx >= SWIPE_THRESHOLD) return 'edit'
  if (dx <= -SWIPE_THRESHOLD) return 'delete'
  return null
}
