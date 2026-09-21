import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Link, Redirect } from 'expo-router';
import React, { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaCard } from '@/components/ui/klea-card';
import { KleaHeader } from '@/components/ui/klea-header';
import { KleaColors } from '@/constants/theme';
import {
  getBailleurConversations,
  getBailleurContrats,
  getBailleurDeparts,
  getBailleurPaiements,
  getBailleurSinistres,
  getAuthenticatedUser,
  getMyBiens,
  type BailleurBien,
  type BailleurConversation,
  type BailleurContrat,
  type BailleurDepart,
  type BailleurPaiement,
  type BailleurSinistre,
} from '@/utils/bailleur-api';
import { buildUserDashboardPath } from '@/utils/user-route';

type Action = {
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  href: string;
};

type MonthStat = {
  key: string;
  label: string;
  signalements: number;
  departs: number;
  paiements: number;
  messages: number;
};

function getMonthKey(dateValue: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string): string {
  if (monthKey === 'unknown') {
    return 'Inconnu';
  }

  const [year, month] = monthKey.split('-').map((value) => Number(value));
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(date)
    .replace(/^./, (character) => character.toUpperCase());
}

function buildRecentMonthKeys(count = 3): string[] {
  const now = new Date();
  const keys: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    keys.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  return keys;
}
 
const actions: Action[] = [
  { title: 'Tableau de bord', subtitle: 'Accueil du bailleur', icon: 'speedometer-outline', href: '/bailleur' },
  { title: 'Gérer mes biens', subtitle: 'Ajouter, modifier ou valider un bien', icon: 'home-outline', href: '/bailleur/mes_biens' },
  { title: 'Mes locataires', subtitle: 'Consulter vos locataires', icon: 'person-outline', href: '/bailleur/mes_locataires' },
  { title: 'Gérer mes contrats', subtitle: 'Voir et suivre mes contrats en cours', icon: 'document-text-outline', href: '/bailleur/contrats' },
  { title: 'Envoyer un message', subtitle: 'Communiquer avec un locataire ou un administrateur', icon: 'chatbubble-ellipses-outline', href: '/bailleur/conversation' },
  { title: 'Confirmer un départ', subtitle: 'Valider le départ d’un locataire', icon: 'log-out-outline', href: '/bailleur/depart' },
  { title: 'Signaler un incident', subtitle: 'Créer un signalement pour un bien', icon: 'alert-circle-outline', href: '/bailleur/sinistres' },
  { title: 'Mes paiements', subtitle: 'Consulter les loyers et paiements reçus', icon: 'card-outline', href: '/bailleur/paiements' },

];

export function BailleurDashboardView() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [biens, setBiens] = useState<BailleurBien[]>([]);
  const [contrats, setContrats] = useState<BailleurContrat[]>([]);
  const [paiements, setPaiements] = useState<BailleurPaiement[]>([]);
  const [conversations, setConversations] = useState<BailleurConversation[]>([]);
  const [sinistres, setSinistres] = useState<BailleurSinistre[]>([]);
  const [departs, setDeparts] = useState<BailleurDepart[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([
      getMyBiens(),
      getBailleurContrats(),
      getBailleurPaiements(),
      getBailleurConversations(),
      getBailleurSinistres(),
      getBailleurDeparts(),
    ])
      .then(([biensResult, contratsResult, paiementsResult, conversationsResult, sinistresResult, departsResult]) => {
        if (!mounted) return;

        const nextBiens = biensResult.status === 'fulfilled' ? biensResult.value : [];
        const nextContrats = contratsResult.status === 'fulfilled' ? contratsResult.value : [];
        const nextPaiements = paiementsResult.status === 'fulfilled' ? paiementsResult.value : [];
        const nextConversations = conversationsResult.status === 'fulfilled' ? conversationsResult.value : [];
        const nextSinistres = sinistresResult.status === 'fulfilled' ? sinistresResult.value : [];
        const nextDeparts = departsResult.status === 'fulfilled' ? departsResult.value : [];

        setBiens(nextBiens);
        setContrats(nextContrats);
        setPaiements(nextPaiements);
        setConversations(nextConversations);
        setSinistres(nextSinistres);
        setDeparts(nextDeparts);

        const firstMonthKey = buildRecentMonthKeys(3)[0] ?? '';
        setSelectedMonth((current) => current || firstMonthKey);

        const hasFailure = [biensResult, contratsResult, paiementsResult, conversationsResult, sinistresResult, departsResult].some((result) => result.status === 'rejected');
        setLoadError(hasFailure ? 'Certaines données n ont pas pu etre chargees.' : null);
        if (hasFailure) {
          Alert.alert('Attention', 'Certaines données du tableau de bord n ont pas pu etre chargees.');
        }
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const totalUnits = biens.length;
  const occupiedUnits = biens.filter((item) => item.occupationStatut === 'en_location').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  const monthlyRevenue = paiements.reduce((total, payment) => total + payment.montant, 0);
  const alerts = sinistres.length + departs.length + contrats.length;
  const actifs = biens.filter((item) => item.validationStatut === 'verifie').length;
  const contratsEnCours = contrats.filter((contract) => contract.etat === 'signe' || contract.etat === 'en_attente').length;

  const monthKeys = useMemo(() => buildRecentMonthKeys(3), []);
  const monthStats = useMemo<MonthStat[]>(() => {
    const messagesByMonth = new Map<string, number>();

    conversations.forEach((conversation) => {
      conversation.messages.forEach((message) => {
        const key = getMonthKey(message.date);
        messagesByMonth.set(key, (messagesByMonth.get(key) ?? 0) + 1);
      });
    });

    return monthKeys.map((key) => ({
      key,
      label: formatMonthLabel(key),
      signalements: sinistres.filter((sinistre) => getMonthKey(sinistre.date) === key).length,
      departs: departs.filter((departure) => getMonthKey(departure.dateSignalement) === key).length,
      paiements: paiements.filter((payment) => getMonthKey(payment.datePaiement) === key).length,
      messages: messagesByMonth.get(key) ?? 0,
    }));
  }, [conversations, departs, monthKeys, paiements, sinistres]);

  const currentMonthData = useMemo(
    () => monthStats.find((month) => month.key === selectedMonth) ?? monthStats[0] ?? null,
    [monthStats, selectedMonth],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <KleaHeader
            title="Tableau de bord"
            right={
              <View style={styles.headerIcons}>
                <Link href="/bailleur/nouveau_bien" asChild>
                  <Pressable style={styles.iconButton}>
                    <Ionicons name="add-circle-outline" size={26} color={KleaColors.secondary} />
                  </Pressable>
                </Link>
                <Link href="/bailleur/notifications" asChild>
                  <Pressable style={styles.iconButton}>
                    <Ionicons name="notifications-outline" size={26} color={KleaColors.secondary} />
                  </Pressable>
                </Link>
                <Link href="/bailleur/profil" asChild>
                  <Pressable style={styles.iconButton}>
                    <Ionicons name="person-circle-outline" size={26} color={KleaColors.secondary} />
                  </Pressable>
                </Link>
              </View>
            }
          />

          {loading ? (
            <KleaCard style={styles.loadingCard}>
              <Text style={styles.loadingText}>Chargement des données réelles...</Text>
            </KleaCard>
          ) : loadError ? (
            <KleaCard style={styles.loadingCard}>
              <Text style={styles.loadingText}>{loadError}</Text>
            </KleaCard>
          ) : null}

          <View style={styles.highlightSection}>
            <View style={styles.highlightColumn}>
              <KleaCard style={styles.highlightCard}>
                <View style={styles.highlightHeader}>
                  <Ionicons name="stats-chart-outline" size={20} color={KleaColors.secondary} />
                  <Text style={styles.highlightLabel}>Taux d’occupation</Text>
                </View>
                <Text style={styles.highlightValue}>{occupancyRate}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${occupancyRate}%` }]} />
                </View>
                <Text style={styles.highlightDetail}>{occupiedUnits} / {totalUnits} biens loués</Text>
              </KleaCard>
              <KleaCard style={styles.highlightCard}>
                <View style={styles.highlightHeader}>
                  <Ionicons name="cash-outline" size={20} color={KleaColors.secondary} />
                  <Text style={styles.highlightLabel}>Revenus du mois</Text>
                </View>
                <Text style={styles.highlightValue}>{monthlyRevenue.toLocaleString('fr-FR')} FCFA</Text>
              </KleaCard>
              <KleaCard style={styles.highlightCard}>
                <View style={styles.highlightHeader}>
                  <Ionicons name="alert-circle-outline" size={20} color={KleaColors.secondary} />
                  <Text style={styles.highlightLabel}>Alertes</Text>
                </View>
                <Text style={[styles.highlightValue, styles.highlightAlertValue]}>{alerts}</Text>
              </KleaCard>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <KleaCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="home-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Biens actifs</Text>
              </View>
              <Text style={styles.summaryValue}>{actifs}</Text>
            </KleaCard>
            <KleaCard style={[styles.summaryCard, styles.summaryCardLast]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="document-text-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Contrats en cours</Text>
              </View>
              <Text style={styles.summaryValue}>{contratsEnCours}</Text>
            </KleaCard>
          </View>

          <View style={styles.summaryRow}>
            <KleaCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="alert-circle-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Sinistres</Text>
              </View>
              <Text style={styles.summaryValue}>{sinistres.length}</Text>
            </KleaCard>
            <KleaCard style={[styles.summaryCard, styles.summaryCardLast]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="log-out-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Départs</Text>
              </View>
              <Text style={styles.summaryValue}>{departs.length}</Text>
            </KleaCard>
          </View>

          <View style={styles.summaryRow}>
            <KleaCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="card-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Paiements reçus</Text>
              </View>
              <Text style={styles.summaryValue}>{paiements.length}</Text>
            </KleaCard>
            <KleaCard style={[styles.summaryCard, styles.summaryCardLast]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Conversations</Text>
              </View>
              <Text style={styles.summaryValue}>{conversations.length}</Text>
            </KleaCard>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistiques par mois</Text>
            <KleaCard style={styles.monthlyCard}>
              <View style={styles.monthlyHeader}>
                <Text style={styles.monthlyTitle}>Mois</Text>
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedMonth}
                  onValueChange={(value) => setSelectedMonth(value)}
                  style={styles.picker}
                  dropdownIconColor={KleaColors.primary}
                >
                  {monthStats.map((month) => (
                    <Picker.Item key={month.key} label={month.label} value={month.key} />
                  ))}
                </Picker>
              </View>
              <View style={styles.monthlyStats}>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyStatLabel}>Signalements</Text>
                  <Text style={styles.monthlyStatValue}>{currentMonthData?.signalements ?? 0}</Text>
                </View>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyStatLabel}>Départs</Text>
                  <Text style={styles.monthlyStatValue}>{currentMonthData?.departs ?? 0}</Text>
                </View>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyStatLabel}>Paiements</Text>
                  <Text style={styles.monthlyStatValue}>{currentMonthData?.paiements ?? 0}</Text>
                </View>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyStatLabel}>Messages</Text>
                  <Text style={styles.monthlyStatValue}>{currentMonthData?.messages ?? 0}</Text>
                </View>
              </View>
            </KleaCard>
          </View>

        </ScrollView>

        <View style={styles.bottomBar}>
          {actions.slice(0, 5).map((action) => (
            <Link key={action.title} href={action.href as any} asChild>
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
      </View>
    </SafeAreaView>
  );
}

export default function BailleurDashboard() {
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    getAuthenticatedUser()
      .then((user) => {
        if (!mounted) return;
        setTargetPath(buildUserDashboardPath(user));
      })
      .catch(() => {
        if (!mounted) return;
        setTargetPath('/bailleur');
      })
      .finally(() => {
        if (mounted) setChecked(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!checked) {
    return null;
  }

  if (targetPath && targetPath !== '/bailleur') {
    return <Redirect href={targetPath as any} />;
  }

  return <BailleurDashboardView />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: KleaColors.background,
  },
  container: {
    flex: 1,
  },
  loadingCard: {
    marginBottom: 12,
  },
  loadingText: {
    color: KleaColors.textMuted,
    fontSize: 13,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    padding: 18,
    marginRight: 12,
  },
  summaryCardLast: {
    marginRight: 0,
  },
  summaryLabel: {
    color: KleaColors.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  summaryValue: {
    color: KleaColors.primary,
    fontSize: 28,
    fontWeight: '700',
  },
  highlightSection: {
    marginBottom: 22,
  },
  highlightSectionTitle: {
    color: KleaColors.secondary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  highlightColumn: {
    gap: 10,
  },
  highlightCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: KleaColors.surface,
    borderWidth: 1,
    borderColor: KleaColors.border,
    marginBottom: 10,
  },
  highlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  highlightLabel: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  highlightValue: {
    color: KleaColors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  highlightAlertValue: {
    color: KleaColors.error,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E8E4DA',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: KleaColors.accent,
  },
  highlightDetail: {
    color: KleaColors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    color: KleaColors.secondary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  monthlyCard: {
    marginBottom: 12,
    padding: 16,
  },
  monthlyHeader: {
    borderBottomWidth: 1,
    borderBottomColor: KleaColors.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  monthlyTitle: {
    color: KleaColors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthlyStat: {
    alignItems: 'center',
  },
  monthlyStatLabel: {
    color: KleaColors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  monthlyStatValue: {
    color: KleaColors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  pickerContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: KleaColors.surface,
  },
  picker: {
    color: KleaColors.primary,
    backgroundColor: KleaColors.surface,
  },
  shortcutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shortcutCard: {
    width: '48%',
    backgroundColor: KleaColors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: KleaColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutText: {
    display: 'none',
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
  bottomLabel: {
    color: KleaColors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  actionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    color: KleaColors.secondary,
    fontSize: 16,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: KleaColors.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
    maxWidth: '80%',
  },
  noticeCard: {
    backgroundColor: '#F1F1E8',
  },
  noticeTitle: {
    color: KleaColors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  noticeText: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
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
});
