import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import {Modal, Pressable, ScrollView, StyleSheet, Text, View,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors } from '@/constants/theme';


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

type NotificationType = 'payment' | 'signalement' | 'contract' | 'message' | 'system';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
  detail: string;
  time: string;
  date: string;
  unread: boolean;
  meta?: { label: string; value: string }[];
  actionLabel?: string;
  actionHref?: string;
};

const typeMeta: Record<
  NotificationType,
  { icon: ComponentProps<typeof Ionicons>['name']; color: string; bg: string }
> = {
  payment: { icon: 'card-outline', color: semantic.success, bg: semantic.successBg },
  signalement: { icon: 'alert-circle-outline', color: semantic.warning, bg: semantic.warningBg },
  contract: { icon: 'document-text-outline', color: semantic.info, bg: semantic.infoBg },
  message: { icon: 'chatbubble-ellipses-outline', color: KleaColors.secondary, bg: semantic.accentSoft },
  system: { icon: 'close-circle-outline', color: semantic.error, bg: semantic.errorBg },
};

const sections: { label: string; data: NotificationItem[] }[] = [
  {
    label: "Aujourd'hui",
    data: [
      {
        id: '1',
        type: 'payment',
        title: 'Loyer payé avec succès',
        subtitle: 'Appartement 2 chambres · Bonapriso — 120 000 FCFA',
        detail:
          'Le loyer du mois de mars a été payé via Orange Money. Le montant a été crédité sur votre compte Kléa et sera versé selon votre calendrier de reversement habituel.',
        time: '09:41',
        date: 'Aujourd\u2019hui, 6 juillet 2026',
        unread: true,
        meta: [
          { label: 'Montant', value: '120 000 FCFA' },
          { label: 'Moyen de paiement', value: 'Orange Money' },
          { label: 'Bien', value: 'Appartement 2 chambres · Bonapriso' },
          { label: 'Locataire', value: 'Aïcha M.' },
        ],
        actionLabel: 'Voir le paiement',
        actionHref: '/bailleur/paiements',
      },
      {
        id: '2',
        type: 'signalement',
        title: 'Nouveau signalement reçu',
        subtitle: 'Fuite d\u2019eau signalée · Studio Akwa',
        detail:
          'Le locataire du studio meublé à Akwa a signalé une fuite d\u2019eau dans la salle de bain. Une intervention est recommandée dans les meilleurs délais pour éviter des dégâts supplémentaires.',
        time: '08:15',
        date: 'Aujourd\u2019hui, 6 juillet 2026',
        unread: true,
        meta: [
          { label: 'Bien', value: 'Studio meublé · Akwa' },
          { label: 'Gravité', value: 'Modérée' },
          { label: 'Locataire', value: 'Paul E.' },
        ],
        actionLabel: 'Voir le signalement',
        actionHref: '/bailleur/signalements',
      },
      {
        id: '3',
        type: 'message',
        title: 'Nouveau message',
        subtitle: 'Le locataire du studio meublé a répondu',
        detail:
          '« Oui, disponible dès le 1er. Une visite ? » — Le locataire a répondu à votre proposition concernant la reconduction du bail.',
        time: '07:52',
        date: 'Aujourd\u2019hui, 6 juillet 2026',
        unread: false,
        meta: [{ label: 'Conversation', value: 'Studio meublé · Akwa' }],
        actionLabel: 'Répondre',
        actionHref: '/bailleur/messages',
      },
    ],
  },
  {
    label: 'Cette semaine',
    data: [
      {
        id: '4',
        type: 'contract',
        title: 'Contrat en attente de signature',
        subtitle: 'Bail · Appartement Bonapriso',
        detail:
          'Le contrat de bail pour l\u2019appartement 2 chambres à Bonapriso est prêt et attend votre signature électronique pour être finalisé.',
        time: 'Lun',
        date: 'Lundi, 30 juin 2026',
        unread: false,
        meta: [
          { label: 'Bien', value: 'Appartement 2 chambres · Bonapriso' },
          { label: 'Statut', value: 'En cours' },
        ],
        actionLabel: 'Consulter le contrat',
        actionHref: '/bailleur/contrats',
      },
      {
        id: '5',
        type: 'system',
        title: 'Paiement refusé',
        subtitle: 'Solde insuffisant · Orange Money',
        detail:
          'La tentative de paiement du loyer via Orange Money a échoué en raison d\u2019un solde insuffisant sur le compte du locataire. Une nouvelle tentative sera proposée automatiquement.',
        time: 'Dim',
        date: 'Dimanche, 29 juin 2026',
        unread: false,
        meta: [
          { label: 'Montant', value: '75 000 FCFA' },
          { label: 'Moyen de paiement', value: 'Orange Money' },
          { label: 'Statut', value: 'Échoué' },
        ],
        actionLabel: 'Voir les paiements',
        actionHref: '/bailleur/paiements',
      },
    ],
  },
];

type Action = {
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  href: string;
};

const actions: Action[] = [
  { title: 'Tableau de bord', subtitle: 'Accueil du bailleur', icon: 'speedometer-outline', href: '/bailleur' },
  { title: 'Gérer mes biens', subtitle: 'Ajouter, modifier ou valider un bien', icon: 'home-outline', href: '/bailleur/biens' },
  { title: 'Gérer mes contrats', subtitle: 'Voir et suivre mes contrats en cours', icon: 'document-text-outline', href: '/bailleur/contrats' },
  { title: 'Envoyer un message', subtitle: 'Communiquer avec un locataire ou un administrateur', icon: 'chatbubble-ellipses-outline', href: '/bailleur/conversation' },
  { title: 'Confirmer un départ', subtitle: 'Valider le départ d\u2019un locataire', icon: 'log-out-outline', href: '/bailleur/depart' },
  { title: 'Signaler un incident', subtitle: 'Créer un signalement pour un bien', icon: 'alert-circle-outline', href: '/bailleur/signalements' },
  { title: 'Mes paiements', subtitle: 'Consulter les loyers et paiements reçus', icon: 'card-outline', href: '/bailleur/paiements' },
  { title: 'Mes locataires', subtitle: 'Consulter vos locataires', icon: 'people-outline', href: '/bailleur/locataires' },
  { title: 'Mes signalements', subtitle: 'Consulter vos signalements et les signalements reçus', icon: 'alert-circle-outline', href: '/bailleur/signalements' },
];

export default function NotificationsScreen() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [items, setItems] = useState(sections);
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const unreadCount = items.reduce(
    (total, section) => total + section.data.filter((n) => n.unread).length,
    0,
  );

  const markAllAsRead = () => {
    setItems((prev) => prev.map((section) => ({ ...section, data: section.data.map((n) => ({ ...n, unread: false })) })));
  };

  const openDetail = (item: NotificationItem) => {
    setSelected(item);
    if (item.unread) {
      setItems((prev) =>
        prev.map((section) => ({
          ...section,
          data: section.data.map((n) => (n.id === item.id ? { ...n, unread: false } : n)),
        })),
      );
    }
  };

  const hasNotifications = items.some((section) => section.data.length > 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerIcons}>
              <Link href="/bailleur/nouveau_bien" asChild>
                <View style={styles.iconButton}>
                  <Ionicons name="add-circle-outline" size={26} color={KleaColors.secondary} />
                </View>
              </Link>
              <Link href="/bailleur/profil" asChild>
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

          {hasNotifications ? (
            items.map((section) =>
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
                              <Text
                                style={[styles.notifTitle, item.unread && styles.notifTitleUnread]}
                                numberOfLines={1}
                              >
                                {item.title}
                              </Text>
                              <Text style={styles.notifTime}>{item.time}</Text>
                            </View>
                            <Text style={styles.notifSubtitle} numberOfLines={2}>
                              {item.subtitle}
                            </Text>
                          </View>
                          {item.unread && <View style={styles.notifDot} />}
                          <Ionicons name="chevron-forward" size={18} color={KleaColors.textMuted} style={styles.notifChevron} />
                        </Pressable>
                      </KleaCard>
                    );
                  })}
                </View>
              ),
            )
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={28} color={KleaColors.secondary} />
              </View>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptyText}>
                Vous serez averti ici dès qu'un paiement, un message ou un signalement arrive.
              </Text>
              <Pressable style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Explorer</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          {actions.slice(0, 5).map((action) => (
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

              <Link href="/bailleur/signalements" asChild>
                <Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
                  <Ionicons name="alert-circle-outline" size={20} color={KleaColors.primary} />
                  <Text style={styles.modalItemText}>Signalement</Text>
                </Pressable>
              </Link>

              <Link href="/bailleur/depart" asChild>
                <Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
                  <Ionicons name="log-out-outline" size={20} color={KleaColors.primary} />
                  <Text style={styles.modalItemText}>Départ</Text>
                </Pressable>
              </Link>
              <Link href="/bailleur/paiements" asChild>
                <Pressable style={styles.modalItem} onPress={() => setMenuOpen(false)}>
                  <Ionicons name="cash-outline" size={20} color={KleaColors.primary} />
                  <Text style={styles.modalItemText}>Paiements</Text>
                </Pressable>
              </Link>

              <Pressable style={styles.modalClose} onPress={() => setMenuOpen(false)}>
                <Text style={styles.modalCloseText}>Fermer</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal
          visible={selected !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelected(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailSheet}>
              {selected && (
                <>
                  <View style={styles.detailHandle} />
                  <View style={styles.detailHeader}>
                    <View
                      style={[
                        styles.iconCircle,
                        styles.detailIconCircle,
                        { backgroundColor: typeMeta[selected.type].bg },
                      ]}
                    >
                      <Ionicons
                        name={typeMeta[selected.type].icon}
                        size={24}
                        color={typeMeta[selected.type].color}
                      />
                    </View>
                    <Pressable onPress={() => setSelected(null)} hitSlop={10} style={styles.detailCloseBtn}>
                      <Ionicons name="close" size={22} color={KleaColors.textMuted} />
                    </Pressable>
                  </View>

                  <ScrollView showsVerticalScrollIndicator={false} style={styles.detailScroll}>
                    <Text style={styles.detailTitle}>{selected.title}</Text>
                    <Text style={styles.detailDate}>
                      {selected.date} · {selected.time}
                    </Text>

                    <Text style={styles.detailBody}>{selected.detail}</Text>

                    {selected.meta && selected.meta.length > 0 && (
                      <View style={styles.metaCard}>
                        {selected.meta.map((row, index) => (
                          <View
                            key={row.label}
                            style={[
                              styles.metaRow,
                              index === selected.meta!.length - 1 && styles.metaRowLast,
                            ]}
                          >
                            <Text style={styles.metaLabel}>{row.label}</Text>
                            <Text style={styles.metaValue}>{row.value}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </ScrollView>

                  {selected.actionHref && (
                    <Link href={selected.actionHref as any} asChild>
                      <Pressable style={styles.detailActionButton} onPress={() => setSelected(null)}>
                        <Text style={styles.detailActionText}>{selected.actionLabel}</Text>
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
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 140,
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
  profileIcon: {
    marginLeft: 14,
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
  emptyButton: {
    backgroundColor: KleaColors.secondary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emptyButtonText: {
    color: KleaColors.primary,
    fontWeight: '700',
    fontSize: 15,
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
  metaCard: {
    backgroundColor: KleaColors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: KleaColors.border,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: KleaColors.border,
  },
  metaRowLast: {
    borderBottomWidth: 0,
  },
  metaLabel: {
    fontSize: 13,
    color: KleaColors.textMuted,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: KleaColors.primary,
    flexShrink: 1,
    textAlign: 'right',
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
});
