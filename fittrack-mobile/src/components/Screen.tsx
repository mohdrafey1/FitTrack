import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, palette, spacing } from '@/constants/theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Render inside a ScrollView (default true). */
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Apply top safe-area padding (turn off when a header handles it). */
  padTop?: boolean;
  /** Extra bottom padding so content clears the tab bar / home indicator. */
  padBottom?: number;
  keyboardAvoiding?: boolean;
}

/** Full-screen FitTrack gradient background with safe-area handling. */
export function Screen({
  children,
  scroll = true,
  refreshing,
  onRefresh,
  padTop = true,
  padBottom = spacing.xxxl,
  keyboardAvoiding = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingTop: padTop ? insets.top + spacing.md : spacing.md },
        { paddingBottom: padBottom + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
      // Lets iOS inset the scroll view for the keyboard natively — more
      // reliable than wrapping a ScrollView in KeyboardAvoidingView.
      automaticallyAdjustKeyboardInsets={keyboardAvoiding && Platform.OS === 'ios'}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={palette.blue600}
            colors={[palette.blue600]}
            progressViewOffset={padTop ? insets.top : 0}
          />
        ) : undefined
      }>
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        styles.content,
        { paddingTop: padTop ? insets.top + spacing.md : spacing.md },
        { paddingBottom: padBottom + insets.bottom },
      ]}>
      {children}
    </View>
  );

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.flex}>
      {/*
        Scrolling screens handle the keyboard through the ScrollView itself
        (see automaticallyAdjustKeyboardInsets); only non-scrolling screens
        need KeyboardAvoidingView.
      */}
      {keyboardAvoiding && !scroll ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
  },
});
