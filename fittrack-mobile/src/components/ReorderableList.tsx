import { GripVertical } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, layout, motion, radius } from '@/constants/theme';
import { haptics } from '@/utils/haptics';
import {
  buildPositions,
  keysInOrder,
  movePosition,
  type Positions,
} from '@/utils/reorder';

/** Screen-reader alternative to dragging, surfaced on the handle. */
const ACCESSIBILITY_ACTIONS = [
  { name: 'increment', label: 'Move down' },
  { name: 'decrement', label: 'Move up' },
];

interface ReorderableListProps {
  /** Row keys in their current order. */
  itemKeys: string[];
  /** Every row must be exactly this tall for the maths to hold. */
  rowHeight: number;
  /** Called with the new key order once a drag settles. */
  onReorder: (keys: string[]) => void;
  /**
   * Fires when a drag starts and ends. Callers should stop any enclosing
   * ScrollView from scrolling while this is true, otherwise the scroll view
   * and the drag fight over the same finger.
   */
  onDragActiveChange?: (active: boolean) => void;
  /**
   * Renders one row. `handle` is a pre-wired grip the user drags — place it
   * inside the row; dragging anywhere else does nothing, so buttons in the row
   * stay tappable.
   */
  renderRow: (key: string, handle: React.ReactNode) => React.ReactNode;
}

/**
 * Absolutely-positioned drag-to-reorder list.
 *
 * Rows are laid out by index rather than by flow, so a drag only has to move
 * one row and animate the indices of the others — no layout thrash, and the
 * dragged row never fights a layout animation over the same property.
 *
 * Sized for short lists (tens of rows), which is what the food picker is.
 *
 * The shared state lives here and rows receive *worklet mutators* rather than
 * the shared values themselves: React Compiler forbids a component mutating
 * something it received as a prop, so each component only writes what it owns.
 */
export function ReorderableList({
  itemKeys,
  rowHeight,
  onReorder,
  onDragActiveChange,
  renderRow,
}: ReorderableListProps) {
  const positions = useSharedValue<Positions>(buildPositions(itemKeys));
  const activeKey = useSharedValue<string | null>(null);

  // Rebuild when rows are added or removed (a food created or deleted while
  // the list is open). Keyed on the joined list so a same-order rerender is
  // not treated as a change.
  const signature = itemKeys.join(' ');
  useEffect(() => {
    positions.value = buildPositions(signature.split(' ').filter(Boolean));
  }, [signature, positions]);

  function beginDrag(key: string) {
    'worklet';
    activeKey.value = key;
    if (onDragActiveChange) runOnJS(onDragActiveChange)(true);
  }

  function dragTo(key: string, nextIndex: number) {
    'worklet';
    const currentIndex = positions.value[key];
    if (currentIndex === undefined || currentIndex === nextIndex) return;
    // eslint-disable-next-line react-hooks/immutability -- worklet write; the list owns this value
    positions.value = movePosition(positions.value, currentIndex, nextIndex);
  }

  /**
   * Dragging is impossible with VoiceOver or TalkBack, so the handle also
   * exposes increment/decrement actions that shift a row one place. Plain JS:
   * assistive tech calls this on the main thread, not from a gesture.
   */
  function moveBy(key: string, delta: number) {
    const from = itemKeys.indexOf(key);
    if (from < 0) return;
    const to = Math.min(Math.max(from + delta, 0), itemKeys.length - 1);
    if (to === from) return;
    const next = [...itemKeys];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    haptics.selection();
    onReorder(next);
  }

  /** Clears the active row and reports the settled order. */
  function endDrag(key: string) {
    'worklet';
    if (activeKey.value !== key) return;
    activeKey.value = null;
    if (onDragActiveChange) runOnJS(onDragActiveChange)(false);
    runOnJS(onReorder)(keysInOrder(positions.value));
  }

  return (
    <View style={{ height: itemKeys.length * rowHeight }}>
      {itemKeys.map((key, index) => (
        <Row
          key={key}
          itemKey={key}
          index={index}
          count={itemKeys.length}
          rowHeight={rowHeight}
          positions={positions}
          activeKey={activeKey}
          beginDrag={beginDrag}
          dragTo={dragTo}
          endDrag={endDrag}
          moveBy={moveBy}
          renderRow={renderRow}
        />
      ))}
    </View>
  );
}

interface RowProps {
  itemKey: string;
  index: number;
  count: number;
  rowHeight: number;
  /** Read-only here — only the list itself writes to these. */
  positions: SharedValue<Positions>;
  activeKey: SharedValue<string | null>;
  beginDrag: (key: string) => void;
  dragTo: (key: string, nextIndex: number) => void;
  endDrag: (key: string) => void;
  moveBy: (key: string, delta: number) => void;
  renderRow: (key: string, handle: React.ReactNode) => React.ReactNode;
}

function Row({
  itemKey,
  index,
  count,
  rowHeight,
  positions,
  activeKey,
  beginDrag,
  dragTo,
  endDrag,
  moveBy,
  renderRow,
}: RowProps) {
  // React Compiler cannot see inside Reanimated's gesture callbacks, so it
  // treats the shared-value writes below as illegal mutation. Driving a gesture
  // that way is the documented Reanimated pattern, so this row opts out of
  // compilation explicitly rather than relying on the compiler to bail. It is a
  // handful of nodes — losing auto-memoization here costs nothing.
  'use no memo';

  const top = useSharedValue(index * rowHeight);
  const startTop = useSharedValue(0);

  // Follow reindexing caused by *other* rows being dragged over this one.
  useAnimatedReaction(
    () => positions.value[itemKey],
    (nextIndex, previousIndex) => {
      if (nextIndex === undefined || nextIndex === previousIndex) return;
      if (activeKey.value === itemKey) return;
      top.value = withSpring(nextIndex * rowHeight, motion.spring.press);
    }
  );

  // Plain function rather than useMemo: React Compiler forbids mutating a
  // shared value listed in a memo hook's dependencies, and it memoizes anyway.
  const drag = Gesture.Pan()
    // A hold before the drag takes over lets a plain swipe scroll the page.
    .activateAfterLongPress(180)
    .onStart(() => {
      startTop.value = top.value;
      beginDrag(itemKey);
      runOnJS(haptics.selection)();
    })
    .onUpdate((event) => {
      // eslint-disable-next-line react-hooks/immutability -- worklet write, see `use no memo` above
      top.value = startTop.value + event.translationY;
      const target = Math.round(top.value / rowHeight);
      dragTo(itemKey, Math.min(Math.max(target, 0), count - 1));
    })
    // onFinalize also runs when the gesture is cancelled, so a row can never
    // stick to the finger.
    .onFinalize(() => {
      if (activeKey.value !== itemKey) return;
      // eslint-disable-next-line react-hooks/immutability -- worklet write, see `use no memo` above
      top.value = withSpring((positions.value[itemKey] ?? 0) * rowHeight, motion.spring.press);
      endDrag(itemKey);
    });

  const rowStyle = useAnimatedStyle(() => {
    const isActive = activeKey.value === itemKey;
    return {
      top: top.value,
      zIndex: isActive ? 2 : 1,
      transform: [
        { scale: withTiming(isActive ? 1.02 : 1, { duration: motion.duration.fast }) },
      ],
    };
  });

  const handle = (
    <GestureDetector gesture={drag}>
      <View
        style={styles.handle}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Reorder handle"
        accessibilityHint="Drag to move this food, or swipe up and down to shift it one place"
        accessibilityValue={{ text: `Position ${index + 1} of ${count}` }}
        accessibilityActions={ACCESSIBILITY_ACTIONS}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') moveBy(itemKey, 1);
          if (event.nativeEvent.actionName === 'decrement') moveBy(itemKey, -1);
        }}
        hitSlop={layout.hitSlop}>
        <GripVertical size={layout.icon.lg} color={colors.textFaint} />
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View style={[styles.row, { height: rowHeight }, rowStyle]}>
      {renderRow(itemKey, handle)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.card,
  },
  handle: {
    width: layout.iconTile.md,
    height: layout.iconTile.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
