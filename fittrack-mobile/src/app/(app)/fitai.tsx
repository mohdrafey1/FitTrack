import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcw, Send, Sparkles } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { getApiErrorMessage, getApiErrorStatus } from '@/api/client';
import { coachApi } from '@/api/coach';
import { Chip } from '@/components/Chip';
import { ModalHeader } from '@/components/ModalHeader';
import { PressableScale } from '@/components/PressableScale';
import { RichText } from '@/components/RichText';
import { Screen } from '@/components/Screen';
import {
  colors,
  gradients,
  layout,
  motion,
  radius,
  shadows,
  spacing,
  typography,
} from '@/constants/theme';
import { useFitAIChat } from '@/hooks/useFitAIChat';
import type { CoachRange } from '@/types/api';
import { haptics } from '@/utils/haptics';

const RANGES: { key: CoachRange; label: string; sharing: string }[] = [
  { key: 'today', label: 'Today', sharing: "today's log" },
  { key: 'week', label: '7 days', sharing: '7 days of logs' },
  { key: 'month', label: '28 days', sharing: '28 days of logs' },
];

const SUGGESTIONS = [
  'What should I improve first?',
  'Am I eating enough protein?',
  'What should I eat more of?',
  'What should I cut back on?',
  'How was today?',
];

export default function FitAIScreen() {
  const { messages, range, ready, setRange, append, clear, nextId, historyForRequest } =
    useFitAIChat();

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let cancelled = false;
    coachApi
      .status()
      .then((status) => {
        if (!cancelled) setAvailable(status.available);
      })
      .catch(() => {
        // Treat an unreachable status check as "try anyway" — the chat call
        // will surface the real problem with a better message.
        if (!cancelled) setAvailable(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || sending) return;

      const history = historyForRequest();
      append({ id: nextId('user'), role: 'user', content: question });
      setDraft('');
      setSending(true);
      haptics.light();

      try {
        const result = await coachApi.chat({ message: question, range, history });
        append({ id: nextId('assistant'), role: 'assistant', content: result.answer });
      } catch (error) {
        if (getApiErrorStatus(error) === 503) setAvailable(false);
        append({
          id: nextId('assistant'),
          role: 'assistant',
          content: getApiErrorMessage(error, 'FitAI could not answer that. Try again.'),
          failed: true,
        });
        haptics.error();
      } finally {
        setSending(false);
      }
    },
    [append, historyForRequest, nextId, range, sending]
  );

  const startOver = useCallback(() => {
    haptics.selection();
    clear();
  }, [clear]);

  const activeRange = RANGES.find((option) => option.key === range) ?? RANGES[1];
  const canSend = draft.trim().length > 1 && !sending && available !== false;

  return (
    <Screen scroll={false} keyboardAvoiding padTop={Platform.OS === 'android'} padBottom={0}>
      <View style={styles.topSpacer} />
      <ModalHeader
        title="FitAI"
        subtitle="Coaching from your own logs"
        right={
          messages.length > 0 ? (
            <PressableScale
              onPress={startOver}
              haptic="none"
              hitSlop={layout.hitSlop}
              accessibilityLabel="Start a new chat"
              style={styles.resetButton}>
              <RotateCcw size={layout.icon.md} color={colors.textSecondary} />
            </PressableScale>
          ) : undefined
        }
      />

      {/* What the assistant is allowed to see */}
      <View style={styles.rangeRow}>
        {RANGES.map((option) => (
          <Chip
            key={option.key}
            label={option.label}
            selected={range === option.key}
            onPress={() => setRange(option.key)}
            style={styles.rangeChip}
          />
        ))}
      </View>
      <Text style={styles.sharingHint}>
        Sharing {activeRange.sharing} and your profile. Estimates only — not medical advice.
      </Text>

      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {available === false && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>FitAI is not enabled</Text>
            <Text style={styles.noticeBody}>
              This server has no AI key configured, so questions cannot be answered right now.
            </Text>
          </View>
        )}

        {ready && messages.length === 0 && available !== false && (
          <Animated.View entering={FadeIn.duration(motion.duration.base)} style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Sparkles size={22} color={colors.accent} strokeWidth={layout.strokeWidth} />
            </View>
            <Text style={styles.emptyTitle}>Ask about your numbers</Text>
            <Text style={styles.emptyBody}>
              FitAI reads your logged food, water and body targets, then answers with your own
              figures.
            </Text>
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <PressableScale
                  key={suggestion}
                  onPress={() => send(suggestion)}
                  haptic="selection"
                  accessibilityLabel={suggestion}
                  style={styles.suggestion}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </PressableScale>
              ))}
            </View>
          </Animated.View>
        )}

        {messages.map((message) =>
          message.role === 'user' ? (
            <Animated.View
              key={message.id}
              entering={FadeIn.duration(motion.duration.base)}
              layout={LinearTransition.duration(motion.duration.base)}
              style={styles.userRow}>
              <LinearGradient
                colors={gradients.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.userBubble}>
                <Text style={styles.userText}>{message.content}</Text>
              </LinearGradient>
            </Animated.View>
          ) : (
            <Animated.View
              key={message.id}
              entering={FadeIn.duration(motion.duration.base)}
              layout={LinearTransition.duration(motion.duration.base)}
              style={[styles.assistantBubble, message.failed && styles.assistantBubbleFailed]}>
              <RichText
                style={message.failed ? styles.assistantTextFailed : styles.assistantText}
                boldStyle={styles.assistantBold}>
                {message.content}
              </RichText>
            </Animated.View>
          )
        )}

        {sending && (
          <Animated.View
            entering={FadeIn.duration(motion.duration.fast)}
            style={[styles.assistantBubble, styles.thinking]}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.thinkingText}>Reading your logs…</Text>
          </Animated.View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask about your progress…"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          multiline
          maxLength={1000}
          editable={available !== false}
          autoCorrect
          underlineColorAndroid="transparent"
          accessibilityLabel="Your question for FitAI"
          onSubmitEditing={() => send(draft)}
        />
        <PressableScale
          onPress={() => send(draft)}
          disabled={!canSend}
          haptic="none"
          accessibilityLabel="Send question"
          accessibilityState={{ disabled: !canSend }}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}>
          <Send size={layout.icon.md} color={colors.onGradient} strokeWidth={layout.strokeWidth} />
        </PressableScale>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topSpacer: {
    height: spacing.md,
  },
  resetButton: {
    width: layout.iconButton,
    height: layout.iconButton,
    borderRadius: radius.full,
    backgroundColor: colors.fill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rangeChip: {
    flex: 1,
  },
  sharingHint: {
    ...typography.caption,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  thread: {
    flex: 1,
  },
  threadContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  notice: {
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  noticeTitle: {
    ...typography.bodyStrong,
    color: colors.warning,
  },
  noticeBody: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.heading,
  },
  emptyBody: {
    ...typography.caption,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  suggestions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  suggestion: {
    backgroundColor: colors.card,
    borderWidth: layout.border,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    minHeight: layout.tapTarget,
  },
  suggestionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  userBubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  userText: {
    ...typography.body,
    color: colors.onGradient,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    backgroundColor: colors.card,
    borderWidth: layout.border,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderBottomLeftRadius: radius.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.card,
  },
  assistantBubbleFailed: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
  },
  assistantText: {
    ...typography.body,
    color: colors.text,
  },
  assistantTextFailed: {
    ...typography.body,
    color: colors.danger,
  },
  assistantBold: {
    color: colors.primaryDark,
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  thinkingText: {
    ...typography.caption,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: layout.hairline,
    borderTopColor: colors.divider,
  },
  input: {
    ...typography.body,
    flex: 1,
    maxHeight: 120,
    minHeight: layout.tapTarget,
    backgroundColor: colors.inputBackground,
    borderWidth: layout.border,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  sendButton: {
    width: layout.tapTarget,
    height: layout.tapTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
