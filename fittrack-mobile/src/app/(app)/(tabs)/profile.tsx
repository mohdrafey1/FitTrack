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
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, gradients, palette, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  ACTIVITY_LEVEL_LABELS,
  bmiCategory,
  FITNESS_GOAL_LABELS,
  GENDER_LABELS,
} from '@/utils/format';

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
          await logout();
          showToast('Logged out successfully');
        },
      },
    ]);
  };

  const bmi = user?.bmi ? parseFloat(user.bmi) : null;
  const bmiInfo = bmi ? bmiCategory(bmi) : null;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Identity card */}
      <Card style={styles.identityCard}>
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}>
          <Text style={styles.avatarInitial}>{user?.username?.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
        <Text style={styles.username}>{user?.username}</Text>
        <View style={styles.emailRow}>
          <Mail size={13} color={palette.gray500} />
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        {!!user?.fitnessGoal && (
          <View style={styles.goalBadge}>
            <Target size={12} color={palette.indigo600} />
            <Text style={styles.goalBadgeText}>{FITNESS_GOAL_LABELS[user.fitnessGoal]}</Text>
          </View>
        )}
      </Card>

      {/* Body stats */}
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

      {/* Details */}
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

      {/* Menu */}
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

      <Pressable
        onPress={confirmLogout}
        accessibilityRole="button"
        style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.8 }]}>
        <LogOut size={18} color={palette.red600} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
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
      <Icon size={17} color={color} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
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
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        menuStyles.row,
        bordered && menuStyles.rowBorder,
        pressed && { backgroundColor: palette.gray50 },
      ]}>
      <View style={[menuStyles.iconBox, { backgroundColor: iconBg }]}>
        <Icon size={17} color={iconColor} />
      </View>
      <View style={menuStyles.textGroup}>
        <Text style={menuStyles.label}>{label}</Text>
        {!!sublabel && <Text style={menuStyles.sublabel}>{sublabel}</Text>}
      </View>
      <ChevronRight size={18} color={palette.gray400} />
    </Pressable>
  );
}

const statStyles = StyleSheet.create({
  block: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  label: {
    fontSize: 11.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    gap: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    flex: 1,
    gap: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  sublabel: {
    fontSize: 12.5,
    color: colors.textMuted,
  },
});

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  identityCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xxl,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.white,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  email: {
    fontSize: 13.5,
    color: colors.textMuted,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: palette.indigo50,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginTop: spacing.xs,
  },
  goalBadgeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: palette.indigo600,
  },
  statsCard: {
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.divider,
  },
  detailsCard: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
  },
  menuCard: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    paddingVertical: 14,
  },
  logoutText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: palette.red600,
  },
});
