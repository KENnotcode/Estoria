import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Reports whether the user asked for reduced motion.
 *
 * Every animated component reads this and collapses to a static, still state
 * (required for any motion above static-tier intensity).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {
        /* Ignore: keep the default (motion enabled). */
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (mounted) setReduced(value);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
