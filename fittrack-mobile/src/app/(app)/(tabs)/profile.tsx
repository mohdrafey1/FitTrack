import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Activity,
  Bell,
  ChevronRight,
  Info,
  LogOut,
  Mail,
  Pencil,
  Ruler,
  Scale,
  Target,
  User as UserIcon,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { FITAI_CLEARANCE } from '@/components/FitAIButton';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, gradients, layout, palette, radius, spacing, typography } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  ACTIVITY_LEVEL_LABELS,
  bmiCategory,
  FITNESS_GOAL_LABELS,
  GENDER_LABELS,
} from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { enter } from '@/utils/motion';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshUser();
    setRefreshing(false);
  }, [refreshUser]);

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          haptics.warning();
          await logout();
          showToast('Logged out successfully');
        },
      },
    ]);
  };

  const bmi = user?.bmi ? parseFloat(user.bmi) : null;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh} padBottom={FITAI_CLEARANCE}>
      <Animated.View entering={enter(0)}>
        <ScreenTitle title="Profile" />

        {/* Identity card */}
        <Card style={styles.identityCard}>
          <LinearGradient
            colors={gradients.brand}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}>
            <Text style={styles.avatarInitial}>{user?.username?.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.username} numberOfLines={1}>
            {user?.username}
          </Text>
          <View style={styles.emailRow}>
            <Mail size={layout.icon.sm} color={colors.textMuted} />
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          {!!user?.fitnessGoal && (
            <View style={styles.goalBadge}>
              <Target size={layout.icon.xs} color={palette.indigo600} />
              <Text style={styles.goalBadgeText}>{FITNESS_GOAL_LABELS[user.fitnessGoal]}</Text>
            </View>
          )}
        </Card>
      </Animated.View>

      {/* Body stats */}
      <Animated.View entering={enter(1)}>
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <StatBlock
              icon={Scale}
              color={palette.blue600}
              value={user?.currentWeight ? `${user.currentWeight} kg` : '—'}
              label="Weight"
            />
            <View style={styles.statDivider} />
            <StatBlock
              icon={Target}
              color={palette.emerald600}
              value={user?.targetWeight ? `${user.targetWeight} kg` : '—'}
              label="Target"
            />
            <View style={styles.statDivider} />
            <StatBlock
              icon={Activity}
              color={palette.purple600}
              value={user?.bmi ?? '—'}
              label={bmiInfo ? `BMI · ${bmiInfo.text}` : 'BMI'}
            />
          </View>
        </Card>
      </Animated.View>

      {/* Details */}
      <Animated.View entering={enter(2)}>
        <SectionHeader title="Details" icon={UserIcon} />
        <Card style={styles.detailsCard}>
          <DetailRow label="Age" value={user?.age ? `${user.age} years` : 'Not set'} />
          <DetailRow label="Height" value={user?.height ? `${user.height} cm` : 'Not set'} />
          <DetailRow label="Gender" value={user?.gender ? GENDER_LABELS[user.gender] : 'Not set'} />
          <DetailRow
            label="Activity level"
            value={user?.activityLevel ? ACTIVITY_LEVEL_LABELS[user.activityLevel] : 'Not set'}
          />
          <DetailRow
            label="Daily targets"
            value={`${user?.targetDailyCalories ?? '—'} cal · ${user?.targetDailyProteins ?? '—'}g protein · ${user?.targetDailyWater ?? '—'}ml water`}
            last
          />
        </Card>
      </Animated.View>

      {/* Menu */}
      <Animated.View entering={enter(3)}>
        <SectionHeader title="Settings" icon={Ruler} />
        <Card style={styles.menuCard}>
          <MenuRow
            icon={Pencil}
            iconColor={palette.blue600}
            iconBg={palette.blue100}
            label="Edit Profile"
            sublabel="Weight, goals and daily targets"
            onPress={() => router.push('/edit-profile')}
          />
          <MenuRow
            icon={Bell}
            iconColor={palette.purple600}
            iconBg={palette.purple100}
            label="Reminders & Notifications"
            sublabel="Protein and water reminders"
            onPress={() => router.push('/reminders')}
            bordered
          />
          <MenuRow
            icon={Info}
            iconColor={palette.emerald600}
            iconBg={palette.emerald100}
            label="About FitTrack"
            sublabel="Track calories, protein and hydration"
            onPress={() =>
              Alert.alert(
                'FitTrack',
                'FitTrack mobile — companion app to the FitTrack web application. Both share the same account and data.'
              )
            }
            bordered
          />
        </Card>

        <PressableScale
          onPress={confirmLogout}
          haptic="none"
          accessibilityLabel="Log out"
          style={styles.logoutButton}>
          <LogOut size={layout.icon.md} color={colors.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </PressableScale>
      </Animated.View>
    </Screen>
  );
}

function StatBlock({
  icon: Icon,
  color,
  value,
  label,
}: {
  icon: typeof Scale;
  color: string;
  value: string;
  label: string;
}) {
  return (
    <View style={statStyles.block}>
      <Icon size={layout.icon.md} color={color} strokeWidth={layout.strokeWidth} />
      <Text style={statStyles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={statStyles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function DetailRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[detailStyles.row, !last && detailStyles.rowBorder]}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function MenuRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  sublabel,
  onPress,
  bordered,
}: {
  icon: typeof Bell;
  iconColor: string;
  iconBg: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  bordered?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      accessibilityLabel={sublabel ? `${label}. ${sublabel}` : label}
      style={[menuStyles.row, bordered && menuStyles.rowBorder]}>
      <View style={[menuStyles.iconBox, { backgroundColor: iconBg }]}>
        <Icon size={layout.icon.md} color={iconColor} strokeWidth={layout.strokeWidth} />
      </View>
      <View style={menuStyles.textGroup}>
        <Text style={menuStyles.label}>{label}</Text>
        {!!sublabel && <Text style={menuStyles.sublabel}>{sublabel}</Text>}
      </View>
      <ChevronRight size={layout.icon.md} color={colors.textFaint} />
    </PressableScale>
  );
}

const statStyles = StyleSheet.create({
  block: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  value: {
    ...typography.numberMd,
  },
  label: {
    ...typography.micro,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: layout.hairline,
    borderBottomColor: colors.divider,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
  },
  value: {
    ...typography.bodyStrong,
    flexShrink: 1,
    textAlign: 'right',
  },
});

const menuStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    minHeight: layout.tapTarget,
  },
  rowBorder: {
    borderTopWidth: layout.hairline,
    borderTopColor: colors.divider,
  },
  iconBox: {
    width: layout.iconTile.md,
    height: layout.iconTile.md,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
  },
  label: {
    ...typography.bodyStrong,
  },
  sublabel: {
    ...typography.caption,
  },
});

const styles = StyleSheet.create({
  identityCard: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarInitial: {
    ...typography.numberXl,
    fontWeight: '800',
    color: colors.onGradient,
  },
  username: {
    ...typography.title,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  email: {
    ...typography.caption,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: palette.indigo50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  goalBadgeText: {
    ...typography.captionStrong,
    color: palette.indigo600,
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: layout.hairline,
    height: 30,
    backgroundColor: colors.divider,
  },
  detailsCard: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  menuCard: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderWidth: layout.border,
    borderColor: colors.dangerBorder,
    borderRadius: radius.md,
    minHeight: layout.tapTarget,
  },
  logoutText: {
    ...typography.bodyStrong,
    fontWeight: '700',
    color: colors.danger,
  },
});
