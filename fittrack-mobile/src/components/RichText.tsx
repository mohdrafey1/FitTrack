import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import { spacing, typography } from '@/constants/theme';

/**
 * The sliver of markdown a chat answer actually uses: **bold** spans and
 * `- ` bullet lines.
 *
 * A full markdown engine would be a dependency and a lot of surface for two
 * constructs. Anything it does not understand renders as plain text, which is
 * the right failure mode for model output.
 */
interface RichTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  /** Colour for the emphasised spans; defaults to the base text colour. */
  boldStyle?: StyleProp<TextStyle>;
}

/** Splits a line into alternating plain and bold segments. */
function segments(line: string): { text: string; bold: boolean }[] {
  const parts: { text: string; bold: boolean }[] = [];
  const pattern = /\*\*([^*]+)\*\*/g;
  let cursor = 0;
  let match = pattern.exec(line);

  while (match) {
    if (match.index > cursor) {
      parts.push({ text: line.slice(cursor, match.index), bold: false });
    }
    parts.push({ text: match[1], bold: true });
    cursor = match.index + match[0].length;
    match = pattern.exec(line);
  }

  if (cursor < line.length) parts.push({ text: line.slice(cursor), bold: false });
  return parts.length > 0 ? parts : [{ text: line, bold: false }];
}

export function RichText({ children, style, boldStyle }: RichTextProps) {
  const lines = children.replace(/\r\n/g, '\n').split('\n');

  return (
    <View style={styles.block}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (trimmed === '') return <View key={index} style={styles.gap} />;

        const bullet = /^[-*•]\s+/.test(trimmed);
        const content = bullet ? trimmed.replace(/^[-*•]\s+/, '') : trimmed;

        const body = (
          <Text style={style}>
            {segments(content).map((part, partIndex) =>
              part.bold ? (
                <Text key={partIndex} style={[styles.bold, boldStyle]}>
                  {part.text}
                </Text>
              ) : (
                <Text key={partIndex}>{part.text}</Text>
              )
            )}
          </Text>
        );

        if (!bullet) return <View key={index}>{body}</View>;

        return (
          <View key={index} style={styles.bulletRow}>
            <Text style={[style, styles.bulletDot]}>•</Text>
            <View style={styles.bulletBody}>{body}</View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.xs,
  },
  gap: {
    height: spacing.xs,
  },
  bold: {
    fontWeight: '700',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  bulletDot: {
    ...typography.body,
    lineHeight: typography.body.lineHeight,
  },
  bulletBody: {
    flex: 1,
  },
});
