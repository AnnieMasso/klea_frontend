import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaHeader } from '@/components/ui/klea-header';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { resolveImageSource } from '@/utils/local-photos';
import { BailleurBien, deleteMyBien, getMyBiens, updateMyBien } from '@/utils/bailleur-api';

type FilterValue = 'tous' | 'en_location' | 'libre';

const filterOptions: Array<{ value: FilterValue; label: string }> = [
  { value: 'tous', label: 'Tous' },
  { value: 'en_location', label: 'En location' },
  { value: 'libre', label: 'Libres' },
];

export default function MesBiensScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterValue>('tous');
  const [loading, setLoading] = useState(true);
  const [biens, setBiens] = useState<BailleurBien[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ titre: '', montant: '', type: '', adresse: '', ville: '' });

  const loadBiens = async () => {
    try {
      setLoading(true);
      const data = await getMyBiens();
      setBiens(data);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBiens();
  }, []);

  const filteredBiens = useMemo(() => {
    if (filter === 'tous') return biens;
    return biens.filter((item) => item.occupationStatut === filter);
  }, [biens, filter]);

  const stats = useMemo(() => {
    const all = biens;
    return {
      total: all.length,
      enLocation: all.filter((item) => item.occupationStatut === 'en_location').length,
      libres: all.filter((item) => item.occupationStatut === 'libre').length,
    };
  }, [biens]);

  const startEdit = (item: BailleurBien) => {
    if (item.occupationStatut === 'en_location') {
      Alert.alert('Modification impossible', 'Un bien en location ne peut pas etre modifie.');
      return;
    }

    setEditingId(item.id);
    setEditDraft({
      titre: item.titre,
      montant: String(item.montant),
      type: item.type,
      adresse: item.adresse,
      ville: item.ville,
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateMyBien(id, {
        titre: editDraft.titre.trim(),
        type: editDraft.type.trim(),
        montant: Number(editDraft.montant.replace(/\D/g, '')) || 0,
        adresse: editDraft.adresse.trim(),
        ville: editDraft.ville.trim(),
      });
      setEditingId(null);
      await loadBiens();
      Alert.alert('Mise a jour', 'Le bien a ete modifie.');
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Mise a jour impossible.');
    }
  };

  const handleDelete = async (id: string, locked: boolean) => {
    if (locked) {
      Alert.alert('Suppression impossible', 'Ce bien est deja en location.');
      return;
    }

    try {
      await deleteMyBien(id);
      await loadBiens();
      Alert.alert('Bien supprime', 'Le bien a ete supprime.');
    } catch (error) {
      Alert.alert('Suppression impossible', error instanceof Error ? error.message : 'Suppression refusee.');
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <KleaHeader
            title="Mes biens"
            subtitle=""
            right={
              <View style={styles.headerIcons}>
                <Link href="/bailleur/nouveau_bien" asChild>
                  <Pressable style={styles.iconButton}>
                    <Ionicons name="add-circle-outline" size={26} color={KleaColors.secondary} />
                  </Pressable>
                </Link>
              </View>
            }
          />

          <View style={styles.filtersWrap}>
            {filterOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setFilter(option.value)}
                style={[styles.filterChip, filter === option.value ? styles.filterChipActive : null]}>
                <Text style={[styles.filterText, filter === option.value ? styles.filterTextActive : null]}>
                  {option.label} ({option.value === 'tous' ? stats.total : option.value === 'en_location' ? stats.enLocation : stats.libres})
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <KleaCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>Chargement...</Text>
            </KleaCard>
          ) : null}

          {!loading && filteredBiens.length === 0 ? (
            <KleaCard style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aucun bien pour ce filtre.</Text>
            </KleaCard>
          ) : null}

          {filteredBiens.map((item) => {
            const isEditing = editingId === item.id;
            const isLocked = item.occupationStatut === 'en_location';

            return (
              <KleaCard key={item.id} style={styles.bienCard}>
                {isEditing ? (
                  <View>
                    <KleaInput label="Titre" value={editDraft.titre} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, titre: value }))} />
                    <KleaInput label="Type" value={editDraft.type} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, type: value }))} />
                    <KleaInput label="Montant" keyboardType="numeric" value={editDraft.montant} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, montant: value.replace(/\D/g, '') }))} />
                    <KleaInput label="Adresse" value={editDraft.adresse} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, adresse: value }))} />
                    <KleaInput label="Ville" value={editDraft.ville} onChangeText={(value) => setEditDraft((prev) => ({ ...prev, ville: value }))} />

                    <View style={styles.actionsRow}>
                      <KleaButton title="Annuler" style={styles.visitButton} textStyle={styles.visitButtonText} onPress={() => setEditingId(null)} />
                      <KleaButton title="Enregistrer" style={styles.visitButton} textStyle={styles.visitButtonText} onPress={() => saveEdit(item.id)} />
                    </View>
                  </View>
                ) : (
                  <View>
                    <View style={styles.mediaBlock}>
                      <View style={[styles.mediaStatusChip, isLocked ? styles.mediaStatusChipBusy : styles.mediaStatusChipFree]}>
                        <Text style={styles.mediaStatusText}>{isLocked ? 'En location' : 'Libre'}</Text>
                      </View>
                      <Text style={styles.validationBadge}>{item.validationStatut === 'verifie' ? 'Valide' : 'En attente admin'}</Text>
                      {item.image ? (
                        <Image source={resolveImageSource(item.image)} style={styles.mediaImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.mediaPlaceholder}>
                          <Ionicons name="image-outline" size={26} color={KleaColors.textMuted} />
                          <Text style={styles.mediaHint}>photo du bien</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.bienBody}>
                      <Text style={styles.bienCardTitle}>{item.titre}</Text>
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={14} color={KleaColors.textMuted} />
                        <Text style={styles.locationText}>{item.ville}, {item.adresse}</Text>
                      </View>
                      <Text style={styles.priceText}>{item.montant.toLocaleString('fr-FR')} FCFA</Text>

                      <View style={styles.actionsRow}>
                        <KleaButton title="Details" style={styles.visitButton} textStyle={styles.visitButtonText} onPress={() => router.push(`/bailleur/detail/${item.id}` as any)} />
                        <KleaButton title="Modifier" style={styles.visitButton} textStyle={styles.visitButtonText} onPress={() => startEdit(item)} disabled={isLocked} />
                        <KleaButton title={isLocked ? 'Suppression bloquee' : 'Supprimer'} style={styles.visitButton} textStyle={styles.visitButtonText} onPress={() => handleDelete(item.id, isLocked)} disabled={isLocked} />
                      </View>
                    </View>
                  </View>
                )}
              </KleaCard>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: KleaColors.background },
  container: { flex: 1 },
  content: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { marginRight: 12, padding: 4 },
  filtersWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  filterChip: {
    borderWidth: 1,
    borderColor: '#D69735',
    backgroundColor: KleaColors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipActive: { borderColor: '#BA7B1E', backgroundColor: '#EAF1EE' },
  filterText: { color: KleaColors.primary, fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: KleaColors.secondary },
  emptyCard: { marginTop: 8 },
  emptyText: { color: KleaColors.textMuted, fontSize: 13 },
  bienCard: { borderRadius: KleaRadius.xl, marginBottom: 4 },
  mediaBlock: {
    height: 120,
    backgroundColor: '#EFE9DE',
    borderRadius: KleaRadius.lg,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaStatusChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  mediaStatusChipBusy: { borderColor: '#E2A2A2', backgroundColor: '#FDEEEE' },
  mediaStatusChipFree: { borderColor: '#A7CDBD', backgroundColor: '#EAF5EF' },
  mediaStatusText: { color: KleaColors.secondary, fontSize: 11, fontWeight: '700' },
  validationBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    color: KleaColors.secondary,
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#ffffffcc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mediaHint: { color: KleaColors.textMuted, fontSize: 12, marginTop: 6 },
  bienBody: { gap: 6 },
  bienCardTitle: { color: KleaColors.primary, fontSize: 17, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationText: { flex: 1, color: KleaColors.textMuted, fontSize: 13 },
  priceText: { color: KleaColors.primary, fontSize: 18, fontWeight: '800' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  visitButton: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 38 },
  visitButtonText: { fontSize: 12 },
});
