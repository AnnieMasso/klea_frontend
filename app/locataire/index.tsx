import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { LocataireScreenShell } from '@/components/ui/locataire-screen-shell';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { getBiens, isBailleurVerified, subscribeBiens, type BienDetail } from '@/utils/biens-store';
import { resolveImageSource } from '@/utils/local-photos';

const labelsByStatus: Record<'libre' | 'jamais_loue', string> = {
  libre: 'Disponible',
  jamais_loue: 'Jamais loué',
};

const typeOptions = ['Tous', 'Appartement', 'Maison', 'Studio', 'Bureau', 'Local commercial', 'Boutique', 'Terrain'];

export default function LocataireBiensScreen() {
  const router = useRouter();
  const [biens, setBiens] = useState<BienDetail[]>(() => getBiens());
  const [typeFilter, setTypeFilter] = useState('Tous');
  const [montantMax, setMontantMax] = useState('');
  const [piecesMin, setPiecesMin] = useState('');

  useEffect(() => {
    setBiens(getBiens());
    const unsubscribe = subscribeBiens(() => setBiens(getBiens()));
    return unsubscribe;
  }, []);

  const biensDisponibles = useMemo(
    () =>
      biens.filter(
        (item) =>
          item.occupationStatut !== 'en_location' &&
          item.validationStatut === 'verifie' &&
          isBailleurVerified(item.bailleurId),
      ),
    [biens],
  );

  const biensFiltres = useMemo(() => {
    return biensDisponibles.filter((bien) => {
      if (typeFilter !== 'Tous' && bien.type !== typeFilter) return false;
      if (montantMax.trim() && bien.montant > Number(montantMax)) return false;
      if (piecesMin.trim() && bien.nbChambres < Number(piecesMin)) return false;
      return true;
    });
  }, [biensDisponibles, typeFilter, montantMax, piecesMin]);

  const handleResetFiltres = () => {
    setTypeFilter('Tous');
    setMontantMax('');
    setPiecesMin('');
  };

  return (
    <LocataireScreenShell title="Biens disponibles" subtitle="">
      <KleaCard style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filtrer les biens</Text>

        <Text style={styles.label}>Type de bien</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={typeFilter} onValueChange={setTypeFilter} style={styles.picker}>
            {typeOptions.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterHalf}>
            <KleaInput
              label="Montant maximum"
              keyboardType="numeric"
              value={montantMax}
              onChangeText={(value) => setMontantMax(value.replace(/\D/g, ''))}
              placeholder="Ex: 250000"
            />
          </View>
          <View style={styles.filterHalf}>
            <KleaInput
              label="Pieces minimum"
              keyboardType="numeric"
              value={piecesMin}
              onChangeText={(value) => setPiecesMin(value.replace(/\D/g, ''))}
              placeholder="Ex: 2"
            />
          </View>
        </View>

        <Pressable onPress={handleResetFiltres}>
          <Text style={styles.resetText}>Reinitialiser les filtres</Text>
        </Pressable>
      </KleaCard>

      {biensFiltres.length === 0 ? (
        <KleaCard>
          <Text style={styles.emptyText}>
            {biensDisponibles.length === 0 ? 'Aucun bien disponible pour le moment.' : 'Aucun bien ne correspond a vos filtres.'}
          </Text>
        </KleaCard>
      ) : null}

      {biensFiltres.map((bien) => (
        <KleaCard key={bien.id} style={styles.bienCard}>
          <View style={styles.mediaBlock}>
            <View style={styles.mediaStatusChip}>
              <Text style={styles.mediaStatusText}>{labelsByStatus[bien.occupationStatut as 'libre' | 'jamais_loue']}</Text>
            </View>
            {bien.images[0] ? (
              <Image source={resolveImageSource(bien.images[0].url)} style={styles.mediaImage} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="image-outline" size={26} color={KleaColors.textMuted} />
                <Text style={styles.mediaHint}>Photo du bien</Text>
              </>
            )}
          </View>

          <View style={styles.bienBody}>
            <Text style={styles.bienCardTitle}>{bien.titre}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={KleaColors.textMuted} />
              <Text style={styles.locationText}>{bien.ville ?? '-'}, {bien.adresse}</Text>
            </View>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceValue}>
                  {bien.montant.toLocaleString('fr-FR')} <Text style={styles.priceCurrency}>FCFA</Text>
                </Text>
                <Text style={styles.priceUnit}> {bien.modalitePaiement}</Text>
              </View>
              <Pressable style={styles.visitButton} onPress={() => router.push(`/locataire/bien/${bien.id}` as any)}>
                <Text style={styles.visitButtonText}>Visiter</Text>
              </Pressable>
            </View>
          </View>
        </KleaCard>
      ))}
    </LocataireScreenShell>
  );
}

const styles = StyleSheet.create({
  filterCard: {
    marginBottom: 4,
  },
  filterTitle: {
    color: KleaColors.secondary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  label: {
    color: KleaColors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: KleaColors.border,
    borderRadius: KleaRadius.md,
    marginBottom: 14,
    overflow: 'hidden',
    backgroundColor: KleaColors.background,
  },
  picker: {
    color: KleaColors.primary,
    backgroundColor: KleaColors.background,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterHalf: {
    flex: 1,
  },
  resetText: {
    color: KleaColors.secondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  bienCard: {
    borderRadius: KleaRadius.xl,
    overflow: 'hidden',
    marginBottom: 4,
  },
  mediaBlock: {
    height: 138,
    backgroundColor: '#EFE9DE',
    borderRadius: KleaRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaStatusChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#A7CDBD',
    backgroundColor: '#EAF5EF',
  },
  mediaStatusText: {
    color: KleaColors.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  mediaHint: {
    color: KleaColors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  bienBody: {
    gap: 6,
  },
  bienCardTitle: {
    color: KleaColors.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    flex: 1,
    color: KleaColors.textMuted,
    fontSize: 13,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceValue: {
    color: KleaColors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  priceCurrency: {
    fontSize: 13,
    fontWeight: '600',
    color: KleaColors.textMuted,
  },
  priceUnit: {
    color: KleaColors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  visitButton: {
    backgroundColor: KleaColors.accent,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 999,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitButtonText: {
    color: KleaColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
