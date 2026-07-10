import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Link } from 'expo-router';
import React, { useState, type ComponentProps } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaCard } from '@/components/ui/klea-card';
import { KleaHeader } from '@/components/ui/klea-header';
import { KleaColors } from '@/constants/theme';

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

const monthStats: MonthStat[] = [
  { key: '2026-07', label: 'Juillet 2026', signalements: 2, departs: 0, paiements: 5, messages: 8 },
  { key: '2026-06', label: 'Juin 2026', signalements: 1, departs: 1, paiements: 7, messages: 4 },
  { key: '2026-05', label: 'Mai 2026', signalements: 3, departs: 2, paiements: 6, messages: 5 },
];

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

export default function BailleurDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(monthStats[0].key);
  const occupancyRate = 92;
  const occupiedUnits = 18;
  const totalUnits = 20;
  const currentMonthData = monthStats.find((month) => month.key === selectedMonth) ?? monthStats[0];

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
                <Text style={styles.highlightValue}>{'334 000 FCFA'}</Text>
              </KleaCard>
              <KleaCard style={styles.highlightCard}>
                <View style={styles.highlightHeader}>
                  <Ionicons name="alert-circle-outline" size={20} color={KleaColors.secondary} />
                  <Text style={styles.highlightLabel}>Alertes</Text>
                </View>
                <Text style={[styles.highlightValue, styles.highlightAlertValue]}>3</Text>
              </KleaCard>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <KleaCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="home-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Biens actifs</Text>
              </View>
              <Text style={styles.summaryValue}>12</Text>
            </KleaCard>
            <KleaCard style={[styles.summaryCard, styles.summaryCardLast]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="document-text-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Contrats en cours</Text>
              </View>
              <Text style={styles.summaryValue}>7</Text>
            </KleaCard>
          </View>

          <View style={styles.summaryRow}>
            <KleaCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="alert-circle-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Sinistres</Text>
              </View>
              <Text style={styles.summaryValue}>3</Text>
            </KleaCard>
            <KleaCard style={[styles.summaryCard, styles.summaryCardLast]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="log-out-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Départs</Text>
              </View>
              <Text style={styles.summaryValue}>1</Text>
            </KleaCard>
          </View>

          <View style={styles.summaryRow}>
            <KleaCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Ionicons name="card-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Paiements reçus</Text>
              </View>
              <Text style={styles.summaryValue}>5</Text>
            </KleaCard>
            <KleaCard style={[styles.summaryCard, styles.summaryCardLast]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={KleaColors.secondary} />
                <Text style={styles.summaryLabel}>Conversations</Text>
              </View>
              <Text style={styles.summaryValue}>12</Text>
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
                  <Text style={styles.monthlyStatValue}>{currentMonthData.signalements}</Text>
                </View>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyStatLabel}>Départs</Text>
                  <Text style={styles.monthlyStatValue}>{currentMonthData.departs}</Text>
                </View>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyStatLabel}>Paiements</Text>
                  <Text style={styles.monthlyStatValue}>{currentMonthData.paiements}</Text>
                </View>
                <View style={styles.monthlyStat}>
                  <Text style={styles.monthlyStatLabel}>Messages</Text>
                  <Text style={styles.monthlyStatValue}>{currentMonthData.messages}</Text>
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
