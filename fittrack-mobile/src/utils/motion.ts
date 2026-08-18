import { FadeInDown } from 'react-native-reanimated';

import { motion } from '@/constants/theme';

/**
 * Standard section entrance: a short fade-up, staggered top-to-bottom so a
 * screen resolves in one quick sweep rather than all at once.
 *
 * Reanimated's layout animations already honour the OS reduce-motion setting,
 * so no extra guard is needed at the call site.
 */
export function enter(index: number) {
  return FadeInDown.duration(motion.duration.base)
    .delay(index * motion.stagger)
    .springify()
    .damping(motion.spring.entrance.damping);
}
