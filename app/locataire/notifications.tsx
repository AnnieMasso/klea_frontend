import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';
import {
  getLocataireNotifications,
  type LocataireNotification,
} from '@/utils/locataire-api';

const semantic = {
  success: '#0F7048',
  successBg: '#E5F4ED',
  warning: '#8A5A14',
  warningBg: '#FBF0DD',
  error: '#B23128',
  errorBg: '#FBE9E7',
  info: '#2B6CB0',
  infoBg: '#E6EFF7',
  accentSoft: '#FBEFD7',
};

const typeMeta: Record<
  LocataireNotification['type'],
  { icon: ComponentProps<typeof Ionicons>['name']; color: string; bg: string; actionLabel: string }
> = {
  payment: { icon: 'cash-outline', color: semantic.success, bg: semantic.successBg, actionLabel: 'Voir mes paiements' },
  contract: { icon: 'document-text-outline', color: semantic.info, bg: semantic.infoBg, actionLabel: 'Voir mon contrat' },
  conversation: { icon: 'people-outline', color: KleaColors.secondary, bg: semantic.accentSoft, actionLabel: 'Voir la conversation' },
  message: { icon: 'chatbubble-ellipses-outline', color: KleaColors.secondary, bg: semantic.accentSoft, actionLabel: 'Repondre' },
  bien: { icon: 'home-outline', color: semantic.warning, bg: semantic.warningBg, actionLabel: 'Voir le bien' },
  compte: { icon: 'shield-checkmark-outline', color: semantic.success, bg: semantic.successBg, actionLabel: 'Voir mon profil' },
  avertissement: { icon: 'warning-outline', color: semantic.error, bg: semantic.errorBg, actionLabel: 'Voir mon profil' },
};

function isToday(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

type Action = {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  href: string;
};

const actions: Action[] = [
  { title: 'Tableau de bord', icon: 'speedometer-outline', href: '/locataire' },
  { title: 'Mon bien', icon: 'home-outline', href: '/locataire/biens' },
  { title: 'Messagerie', icon: 'chatbubble-ellipses-outline', href: '/locataire/conversation' },
  { title: 'Mon contrat', icon: 'document-text-outline', href: '/locataire/contrat' },
  { title: 'Mes paiements', icon: 'cash-outline', href: '/locataire/paiements' },
];

export default function LocataireNotificationsScreen() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<(LocataireNotification & { read?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Array<LocataireNotification & { read: boolean }>>([]);

  const refresh = async () => {
    try {
      setLoading(true);
      const data = await getLocataireNotifications();
      setItems((previous) => {
        const readMap = new Map(previous.map((item) => [item.id, item.read]));
        return data.map((item) => ({ ...item, read: readMap.get(item.id) ?? false }));
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const unreadCount = items.filter((item) => !item.read).length;

  const sections = useMemo(() => {
    const today = items.filter((item) => isToday(item.date));
    const earlier = items.filter((item) => !isToday(item.date));
    return [
      { label: "Aujourd'hui", data: today },
      { label: 'Plus tot', data: earlier },
    ];
  }, [items]);

  const markAllAsRead = () => {
    setItems((previous) => previous.map((item) => ({ ...item, read: true })));
  };

  const openDetail = (item: LocataireNotification & { read: boolean }) => {
    setSelected(item);
    if (!item.read) {
      setItems((previous) => previous.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry)));
    }
  };

  const hasNotifications = items.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerIcons}>
              <Link href="/locataire/profil" asChild>
                <View style={styles.iconButton}>
                  <Ionicons name="person-circle-outline" size={26} color={KleaColors.secondary} />
                </View>
              </Link>
            </View>
          </View>

          <View style={styles.subHeader}>
            <View style={styles.unreadPill}>
              <View style={styles.unreadDot} />
              <Text style={styles.unreadPillText}>
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Aucune nouvelle notification'}
              </Text>
            </View>
            {unreadCount > 0 && (
              <Pressable onPress={markAllAsRead} hitSlop={8}>
                <Text style={styles.markAllText}>Tout marquer comme lu</Text>
              </Pressable>
            )}
          </View>

          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chargement...</Text>
            </View>
          ) : null}

          {!loading && hasNotifications ? (
            sections.map((section) =>
              section.data.length === 0 ? null : (
                <View key={section.label} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.label}</Text>
                  {section.data.map((item) => {
                    const meta = typeMeta[item.type];
                    return (
                      <KleaCard key={item.id} style={styles.notifCard}>
                        <Pressable style={styles.notifRow} onPress={() => openDetail(item)}>
                          <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
                            <Ionicons name={meta.icon} size={20} color={meta.color} />
                          </View>
                          <View style={styles.notifTextWrap}>
                            <View style={styles.notifTitleRow}>
                              <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
                                {item.title}
                              </Text>
                              <Text style={styles.notifTime}>
                                {new Date(item.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                            <Text style={styles.notifSubtitle} numberOfLines={2}>
                              {item.subtitle}
                            </Text>
                          </View>
                          {!item.read && <View style={styles.notifDot} />}
                          <Ionicons name="chevron-forward" size={18} color={KleaColors.textMuted} style={styles.notifChevron} />
                        </Pressable>
                      </KleaCard>
                    );
                  })}
                </View>
              ),
            )
          ) : null}

          {!loading && !hasNotifications ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={28} color={KleaColors.secondary} />
              </View>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptyText}>
                Vous serez averti ici s'il y'a du nouveau
              </Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.bottomBar}>
          {actions.map((action) => (
            <Link key={action.title} href={action.href as any} asChild>
              <Pressable style={styles.bottomAction}>
                <Ionicons
                  name={action.icon}
                  size={22}
                  color={pathname === action.href ? KleaColors.secondary : KleaColors.primary}
                />
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

        <Modal visible={selected !== null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.detailSheet}>
              {selected && (
                <>
                  <View style={styles.detailHandle} />
                  <View style={styles.detailHeader}>
                    <View style={[styles.iconCircle, styles.detailIconCircle, { backgroundColor: typeMeta[selected.type].bg }]}>
                      <Ionicons name={typeMeta[selected.type].icon} size={24} color={typeMeta[selected.type].color} />
                    </View>
                    <Pressable onPress={() => setSelected(null)} hitSlop={10} style={styles.detailCloseBtn}>
                      <Ionicons name="close" size={22} color={KleaColors.textMuted} />
                    </Pressable>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
                    <Text style={styles.detailTitle}>{selected.title}</Text>
                    <Text style={styles.detailDate}>
                      {new Date(selected.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      {' · '}
                      {new Date(selected.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    <Text style={styles.detailBody}>{selected.subtitle}</Text>
                  </ScrollView>

                  {selected.actionHref && (
                    <Link href={selected.actionHref as any} asChild>
                      <Pressable style={styles.detailActionButton} onPress={() => setSelected(null)}>
                        <Text style={styles.detailActionText}>{typeMeta[selected.type].actionLabel}</Text>
                      </Pressable>
                    </Link>
                  )}

                  {selected.bienId && (
                    <Link href={`/locataire/bien/${selected.bienId}` as any} asChild>
                      <Pressable style={styles.detailSecondaryButton} onPress={() => setSelected(null)}>
                        <Text style={styles.detailSecondaryText}>Voir les details du bien</Text>
                      </Pressable>
                    </Link>
                  )}
                </>
              )}
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
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 176,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: KleaColors.border,
  },
  headerTitle: {
    color: KleaColors.primary,
    fontSize: 26,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 12,
    padding: 4,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: semantic.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: KleaColors.secondary,
  },
  unreadPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: KleaColors.primary,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: KleaColors.secondary,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.3,
    color: KleaColors.textMuted,
    marginBottom: 12,
  },
  notifCard: {
    backgroundColor: KleaColors.surface,
    borderWidth: 1,
    borderColor: KleaColors.border,
    marginBottom: 10,
    padding: 0,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifTextWrap: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: KleaColors.primary,
    flexShrink: 1,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  notifTime: {
    fontSize: 11,
    color: KleaColors.textMuted,
    flexShrink: 0,
  },
  notifSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: KleaColors.textMuted,
    marginTop: 3,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: KleaColors.secondary,
    marginTop: 5,
    flexShrink: 0,
  },
  notifChevron: {
    marginLeft: 2,
    marginTop: 2,
    flexShrink: 0,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: KleaColors.surface,
    borderWidth: 1,
    borderColor: KleaColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: KleaColors.primary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: KleaColors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
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
    alignItems: 'center',
    width: '16.6667%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: KleaColors.surface,
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderColor: KleaColors.border,
  },
  modalTitle: {
    color: KleaColors.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  modalItemText: {
    color: KleaColors.textMuted,
    fontSize: 15,
    marginLeft: 8,
  },
  modalClose: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCloseText: {
    color: KleaColors.secondary,
    fontWeight: '700',
  },
  detailSheet: {
    backgroundColor: KleaColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: KleaColors.border,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '82%',
  },
  detailHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: KleaColors.border,
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  detailCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: KleaColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailScroll: {
    flexGrow: 0,
  },
  detailTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: KleaColors.primary,
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 12,
    color: KleaColors.textMuted,
    marginBottom: 16,
  },
  detailBody: {
    fontSize: 15,
    lineHeight: 22,
    color: KleaColors.primary,
    marginBottom: 20,
  },
  detailActionButton: {
    backgroundColor: KleaColors.secondary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  detailActionText: {
    color: KleaColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  detailSecondaryButton: {
    backgroundColor: KleaColors.surface,
    borderWidth: 1.5,
    borderColor: KleaColors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  detailSecondaryText: {
    color: KleaColors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
});
