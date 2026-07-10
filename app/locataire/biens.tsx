import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaCard } from '@/components/ui/klea-card';
import { KleaHeader } from '@/components/ui/klea-header';
import { KleaColors } from '@/constants/theme';
import {
    CURRENT_LOCATAIRE_ID,
    CURRENT_LOCATAIRE_NOM,
    getAllConversations,
    getBienForLocataire,
    getContratsForLocataire,
    subscribeBiens,
} from '@/utils/biens-store';

type Action = {
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  href: string;
};

const actions: Action[] = [
  { title: 'Tableau de bord', subtitle: 'Accueil du locataire', icon: 'speedometer-outline', href: '/locataire' },
  { title: 'Mon bien', subtitle: 'Consulter le bien que vous occupez', icon: 'home-outline', href: '/locataire/biens' },
  { title: 'Mon contrat', subtitle: 'Voir, signer ou annuler votre contrat', icon: 'document-text-outline', href: '/locataire/contrat' },
  { title: 'Messagerie', subtitle: 'Echanger avec votre bailleur', icon: 'chatbubble-ellipses-outline', href: '/locataire/conversation' },
  { title: 'Mes paiements', subtitle: 'Effectuer et consulter vos paiements', icon: 'cash-outline', href: '/locataire/paiements' },
  { title: 'Signaler un depart', subtitle: 'Prevenir le bailleur de votre depart', icon: 'log-out-outline', href: '/locataire/depart' },
  { title: 'Declarer un sinistre', subtitle: 'Signaler un incident', icon: 'alert-circle-outline', href: '/locataire/sinistre' },
  { title: 'Effectuer un signalement', subtitle: 'Transmettre un signalement', icon: 'warning-outline', href: '/locataire/signalement' },
];

function monthKey(dateStr: string) {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function LocataireDashboard() {
  const [refreshTick, forceRefresh] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeBiens(() => forceRefresh((value) => value + 1));
    return unsubscribe;
  }, []);

  const bien = useMemo(() => getBienForLocataire(CURRENT_LOCATAIRE_ID), [refreshTick]);
  const contrats = useMemo(() => getContratsForLocataire(CURRENT_LOCATAIRE_ID), [refreshTick]);
  const contratActif = contrats.find((contract) => contract.statut === 'actif') ?? contrats[0] ?? null;
  const conversations = useMemo(
    () => getAllConversations().filter((conversation) => conversation.locataireId === CURRENT_LOCATAIRE_ID),
    [refreshTick],
  );

  const demandesAnnulation = bien?.demandesAnnulation.filter((demande) => demande.locataire === CURRENT_LOCATAIRE_NOM) ?? [];
  const departsSignales = bien?.departsPreavis.filter((depart) => depart.locataire === CURRENT_LOCATAIRE_NOM) ?? [];
  const sinistresDeclares = bien?.sinistres ?? [];
  const paiementsEffectues = bien?.paiements.filter((payment) => payment.contratId === contratActif?.id) ?? [];
  const messagesTotal = conversations.reduce((sum, conversation) => sum + conversation.messages.length, 0);

  const progressionContrat = 3

  const monthStats = useMemo(() => {
    const keys = new Set<string>();
    keys.add(monthKey(new Date().toISOString()));
    paiementsEffectues.forEach((payment) => keys.add(monthKey(payment.datePaiement)));
    sinistresDeclares.forEach((sinistre) => keys.add(monthKey(sinistre.dateSinistre)));
    departsSignales.forEach((depart) => keys.add(monthKey(depart.dateSignalement)));
    conversations.forEach((conversation) => conversation.messages.forEach((message) => keys.add(monthKey(message.date))));

    return Array.from(keys)
      .sort((a, b) => (a < b ? 1 : -1))
      .slice(0, 3)
      .map((key) => ({
        key,
        label: monthLabel(key),
        paiements: paiementsEffectues.filter((payment) => monthKey(payment.datePaiement) === key).length,
        sinistres: sinistresDeclares.filter((sinistre) => monthKey(sinistre.dateSinistre) === key).length,
        departs: departsSignales.filter((depart) => monthKey(depart.dateSignalement) === key).length,
        messages: conversations.reduce(
          (sum, conversation) => sum + conversation.messages.filter((message) => monthKey(message.date) === key).length,
          0,
        ),
      }));
  }, [paiementsEffectues, sinistresDeclares, departsSignales, conversations]);

  const currentMonthData = monthStats.find((month) => month.key === selectedMonth) ?? monthStats[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <KleaHeader
            title="Tableau de bord"
            right={
              <View style={styles.headerIcons}>
                <Link href="/locataire/biens" asChild>
                  <Pressable style={styles.iconButton}>
                    <Ionicons name="home-outline" size={26} color={KleaColors.secondary} />
                  </Pressable>
                </Link>
                <Link href="/locataire/profil" asChild>
                  <Pressable style={styles.iconButton}>
                    <Ionicons name="person-circle-outline" size={26} color={KleaColors.secondary} />
                  </Pressable>
                </Link>
              </View>
            }
          />

          <View style={styles.highlightSection}>
            <View style={styles.highlightColumn}>
              <KleaCard style={styles.highlightCard}>
                <View style={styles.highlightHeader}>
                  <Ionicons name="document-text-outline" size={20} color={KleaColors.secondary} />
                  <Text style={styles.highlightLabel}>Contrats signés</Text>
                </View>
                <Text style={styles.highlightValue}>{progressionContrat}</Text>
              </KleaCard>
              <KleaCard style={styles.highlightCard}>
                <View style={styles.highlightHeader}>
                  <Ionicons name="cash-outline" size={20} color={KleaColors.secondary} />
                  <Text style={styles.highlightLabel}>Loyer mensuel moyen</Text>
                </View>
                <Text style={styles.highlightValue}>
                  {contratActif ? `${contratActif.montant.toLocaleString('fr-FR')} FCFA` : '-'}
                </Text>
              </KleaCard>
              <KleaCard style={styles.highlightCard}>
                <View style={styles.highlightHeader}>
                  <Ionicons name="alert-circle-outline" size={20} color={KleaColors.secondary} />
                  <Text style={styles.highlightLabel}>Alertes</Text>
                </View>
                <Text style={[styles.highlightValue, styles.highlightAlertValue]}>
                  {sinistresDeclares.filter((sinistre) => sinistre.statut !== 'ferme').length + demandesAnnulation.filter((demande) => demande.statut === 'en_attente').length}
                </Text>
              </KleaCard>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <KleaCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="cash-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Paiements effectues</Text>
              </View>
              <Text style={styles.summaryValue}>{paiementsEffectues.length}</Text>
            </KleaCard>
          </View>

          <View style={styles.summaryRow}>
            <KleaCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="alert-circle-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Sinistres declares</Text>
              </View>
              <Text style={styles.summaryValue}>{sinistresDeclares.length}</Text>
            </KleaCard>
            <KleaCard style={[styles.summaryCard, styles.summaryCardLast]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="log-out-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Departs signales</Text>
              </View>
              <Text style={styles.summaryValue}>{departsSignales.length}</Text>
            </KleaCard>
          </View>

          <View style={styles.summaryRow}>
            <KleaCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="close-circle-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Demandes d'annulation</Text>
              </View>
              <Text style={styles.summaryValue}>{demandesAnnulation.length}</Text>
            </KleaCard>
            <KleaCard style={[styles.summaryCard, styles.summaryCardLast]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="people-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Conversations</Text>
              </View>
              <Text style={styles.summaryValue}>{conversations.length}</Text>
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
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 176,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: 12,
    padding: 4,
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
