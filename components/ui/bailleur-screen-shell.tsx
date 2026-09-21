import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaHeader } from '@/components/ui/klea-header';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { getAuthenticatedUser } from '@/utils/bailleur-api';
import { buildUserDashboardPath } from '@/utils/user-route';

type BottomAction = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
};

const bottomActions: BottomAction[] = [
  { title: 'Bord', icon: 'speedometer-outline', href: '/bailleur' },
  { title: 'Biens', icon: 'home-outline', href: '/bailleur/mes_biens' },
  { title: 'Messages', icon: 'chatbubble-ellipses-outline', href: '/bailleur/conversation' },
  { title: 'Contrats', icon: 'document-text-outline', href: '/bailleur/contrats' },
  { title: 'Paiements', icon: 'cash-outline', href: '/bailleur/paiements' },
  { title: 'Profil', icon: 'person-outline', href: '/bailleur/mes_locataires' },
];

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollEnabled?: boolean;
};

export function BailleurScreenShell({ title, subtitle, children, contentStyle, scrollEnabled = true }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardHref, setDashboardHref] = useState('/bailleur');

  useEffect(() => {
    let mounted = true;

    getAuthenticatedUser()
      .then((user) => {
        if (!mounted) return;
        setDashboardHref(buildUserDashboardPath(user));
      })
      .catch(() => {
        if (mounted) setDashboardHref('/bailleur');
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {scrollEnabled ? (
          <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
            <KleaHeader
              title={title}
              subtitle={subtitle}
              right={
                <View style={styles.headerIcons}>
                  <Link href="/bailleur/nouveau_bien" asChild>
                    <Pressable style={styles.iconButton}>
                      <Ionicons name="add-circle-outline" size={26} color={KleaColors.secondary} />
                    </Pressable>
                  </Link>
                  <Link href="/bailleur/notifications" asChild>
                    <Pressable style={styles.iconButton}>
                      <Ionicons name="notifications-outline" size={24} color={KleaColors.secondary} />
                    </Pressable>
                  </Link>
                  <Link href="/bailleur/profil" asChild>
                    <Pressable style={styles.profileIcon}>
                      <Ionicons name="person-circle-outline" size={26} color={KleaColors.secondary} />
                    </Pressable>
                  </Link>
                </View>
              }
            />

            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.contentNonScrollable, contentStyle]}>
            <KleaHeader
              title={title}
              subtitle={subtitle}
              right={
                <View style={styles.headerIcons}>
                  <Link href="/bailleur/nouveau_bien" asChild>
                    <Pressable style={styles.iconButton}>
                      <Ionicons name="add-circle-outline" size={26} color={KleaColors.secondary} />
                    </Pressable>
                  </Link>
                  <Link href="/bailleur/notifications" asChild>
                    <Pressable style={styles.iconButton}>
                      <Ionicons name="notifications-outline" size={24} color={KleaColors.secondary} />
                    </Pressable>
                  </Link>
                  <Link href="/bailleur/profil" asChild>
                    <Pressable style={styles.profileIcon}>
                      <Ionicons name="person-circle-outline" size={26} color={KleaColors.secondary} />
                    </Pressable>
                  </Link>
                </View>
              }
            />

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

              <Link href="/bailleur/sinistres" asChild>
                <Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
                  <Ionicons name="alert-circle-outline" size={20} color={KleaColors.primary} />
                  <Text style={styles.modalItemText}>Sinistres</Text>
                </Pressable>
              </Link>

              <Link href="/bailleur/depart" asChild>
                <Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
                  <Ionicons name="log-out-outline" size={20} color={KleaColors.primary} />
                  <Text style={styles.modalItemText}>Depart</Text>
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
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 126,
    gap: 12,
  },
  contentNonScrollable: {
    flex: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 12,
    padding: 4,
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
