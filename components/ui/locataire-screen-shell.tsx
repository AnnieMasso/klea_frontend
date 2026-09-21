import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaHeader } from '@/components/ui/klea-header';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { getLocataireAuthUser } from '@/utils/locataire-api';
import { buildUserDashboardPath } from '@/utils/user-route';

type BottomAction = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

const bottomActions: BottomAction[] = [
  { title: 'Mon bien', icon: 'home-outline', href: '/locataire/biens' },
  { title: 'Bord', icon: 'speedometer-outline', href: '/locataire' },
  { title: 'Messages', icon: 'chatbubble-ellipses-outline', href: '/locataire/conversation' },
  { title: 'Contrat', icon: 'document-text-outline', href: '/locataire/contrat' },
  { title: 'Paiements', icon: 'cash-outline', href: '/locataire/paiements' },
];

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
};

export function LocataireScreenShell({ title, subtitle, children, contentStyle, scrollEnabled = true }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardHref, setDashboardHref] = useState('/locataire');

  useEffect(() => {
    let mounted = true;

    getLocataireAuthUser()
      .then((user) => {
        if (!mounted) return;
        setDashboardHref(buildUserDashboardPath(user));
      })
      .catch(() => {
        if (mounted) setDashboardHref('/locataire');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const header = (
    <KleaHeader
      title={title}
      subtitle={subtitle}
      right={
        <View style={styles.headerIcons}>
          <Link href="/locataire/profil" asChild>
            <Pressable style={styles.profileIcon}>
              <Ionicons name="person-circle-outline" size={26} color={KleaColors.secondary} />
            </Pressable>
          </Link>
          <Link href="/locataire/notifications" asChild>
            <Pressable style={styles.profileIcon}>
              <Ionicons name="notifications-outline" size={26} color={KleaColors.secondary} />
            </Pressable>
          </Link>
        </View>
      }
    />
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {scrollEnabled ? (
          <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.contentNonScrollable, contentStyle]}>
            {header}
            {children}
          </View>
        )}

        <View style={styles.bottomBar}>
          {bottomActions.map((action) => (
            <Link key={action.title} href={(action.title === 'Bord' ? dashboardHref : action.href) as any} asChild>
              <Pressable style={styles.bottomAction}>
                <Ionicons name={action.icon} size={22} color={KleaColors.primary} />
              </Pressable>
            </Link>
          ))}

          <Pressable style={styles.bottomAction} onPress={() => setMenuOpen(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={KleaColors.primary} />
          </Pressable>
        </View>

        <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Plus</Text>

              <Link href="/locataire/depart" asChild>
                <Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
                  <Ionicons name="log-out-outline" size={20} color={KleaColors.primary} />
                  <Text style={styles.modalItemText}>Signaler un depart</Text>
                </Pressable>
              </Link>

              <Link href="/locataire/sinistre" asChild>
                <Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
                  <Ionicons name="alert-circle-outline" size={20} color={KleaColors.primary} />
                  <Text style={styles.modalItemText}>Declarer un sinistre</Text>
                </Pressable>
              </Link>

              <Link href="/locataire/signalement" asChild>
                <Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
                  <Ionicons name="warning-outline" size={20} color={KleaColors.primary} />
                  <Text style={styles.modalItemText}>Effectuer un signalement</Text>
                </Pressable>
              </Link>

              <Pressable style={styles.modalClose} onPress={() => setMenuOpen(false)}>
                <Text style={styles.modalCloseText}>Fermer</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 154,
    gap: 12,
  },
  contentNonScrollable: {
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    marginLeft: 2,
    padding: 2,
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
    width: '14.2857%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16,50,47,0.28)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalContent: {
    backgroundColor: KleaColors.surface,
    borderRadius: KleaRadius.xl,
    borderWidth: 1,
    borderColor: KleaColors.border,
    padding: 18,
  },
  modalTitle: {
    color: KleaColors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  modalItemText: {
    color: KleaColors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalClose: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: KleaRadius.md,
    borderWidth: 1,
    borderColor: KleaColors.border,
  },
  modalCloseText: {
    color: KleaColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
