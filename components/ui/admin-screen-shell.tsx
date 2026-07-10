import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaHeader } from '@/components/ui/klea-header';
import { KleaColors } from '@/constants/theme';

type BottomAction = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

const bottomActions: BottomAction[] = [
  { title: 'Bord', icon: 'speedometer-outline', href: '/administrateur' },
  { title: 'Bailleurs', icon: 'briefcase-outline', href: '/administrateur/bailleurs' },
  { title: 'Locataires', icon: 'people-outline', href: '/administrateur/locataires' },
  { title: 'Biens', icon: 'home-outline', href: '/administrateur/biens' },
  { title: 'Signalements', icon: 'alert-circle-outline', href: '/administrateur/signalements' },
];

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AdminScreenShell({ title, subtitle, children, contentStyle }: Props) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
          <KleaHeader title={title} subtitle={subtitle} />
          {children}
        </ScrollView>

        <View style={styles.bottomBar}>
          {bottomActions.map((action) => (
            <Link key={action.title} href={action.href as any} asChild>
              <Pressable style={styles.bottomAction}>
                <Ionicons name={action.icon} size={22} color={KleaColors.primary} />
              </Pressable>
            </Link>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: KleaColors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: KleaColors.surface,
    borderTopWidth: 1,
    borderTopColor: KleaColors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 18,
  },
  bottomAction: {
    width: '20%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
