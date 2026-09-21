import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { VerificationStatusBadge } from '@/components/ui/verification-status-badge';
import { KleaColors } from '@/constants/theme';
import { deleteAdminUser, getAdminLocataires, validateAdminUser } from '@/utils/admin-api';
import { resolveImageSource } from '@/utils/local-photos';

export default function AdminLocataireDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const locataireId = Number(typeof params.id === 'string' ? params.id : '0');

  const [row, setRow] = useState<Awaited<ReturnType<typeof getAdminLocataires>>[number] | null>(null);

  const showFeedback = (title: string, message: string) => {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const refresh = async () => {
    try {
      const list = await getAdminLocataires();
      setRow(list.find((item) => item.locataire.id === locataireId) ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger ce locataire.';
      showFeedback('Erreur', message);
      setRow(null);
    }
  };

  useEffect(() => {
    if (!locataireId) return;
    void refresh();
  }, [locataireId]);

  const handleDelete = () => {
    if (!row) return;

    const confirmed = typeof window !== 'undefined'
      ? window.confirm('Supprimer ce locataire ? Cette action est irreversible.')
      : true;

    if (!confirmed) return;

    void (async () => {
      try {
        await deleteAdminUser(row.locataire.id);
        showFeedback('Suppression reussie', 'Le locataire a ete supprime.');
        router.back();
      } catch (error) {
        showFeedback('Impossible', error instanceof Error ? error.message : 'Suppression refusee.');
      }
    })();
  };

  if (!row) {
    return (
      <AdminScreenShell title="Locataire" subtitle="Introuvable">
        <KleaCard><Text style={styles.emptyText}>Ce locataire est introuvable.</Text></KleaCard>
      </AdminScreenShell>
    );
  }

  const fullName = `${row.locataire.prenom ?? ''} ${row.locataire.nom}`.trim() || row.locataire.email;
  const isVerified = row.locataire.statut === 'actif';

  return (
    <AdminScreenShell title={fullName} subtitle={row.locataire.email}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Text style={styles.line}>{fullName}</Text>
        <Text style={styles.line}>{row.locataire.email}</Text>
        <Text style={styles.line}>Bien occupe: {row.occupied_bien?.titre ?? 'Aucun'}</Text>
        <VerificationStatusBadge verified={isVerified} />
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Documents fournis</Text>
        <View style={styles.docsGrid}>
          <View style={styles.docItem}>
            <Text style={styles.docLabel}>CNI recto</Text>
            {row.locataire.cni_recto ? <Image source={resolveImageSource(row.locataire.cni_recto)} style={styles.docImage} resizeMode="cover" /> : <Text style={styles.docEmpty}>Non fourni</Text>}
          </View>
          <View style={styles.docItem}>
            <Text style={styles.docLabel}>CNI verso</Text>
            {row.locataire.cni_verso ? <Image source={resolveImageSource(row.locataire.cni_verso)} style={styles.docImage} resizeMode="cover" /> : <Text style={styles.docEmpty}>Non fourni</Text>}
          </View>
          <View style={styles.docItem}>
            <Text style={styles.docLabel}>Assurance habitation</Text>
            {row.locataire.assurance_habitation ? <Image source={resolveImageSource(row.locataire.assurance_habitation)} style={styles.docImage} resizeMode="cover" /> : <Text style={styles.docEmpty}>Non fourni</Text>}
          </View>
        </View>
      </KleaCard>

      <KleaCard style={styles.card}>
        {!isVerified ? (
          <KleaButton
            title="Valider"
            onPress={async () => {
              try {
                await validateAdminUser(row.locataire.id);
                await refresh();
                showFeedback('Validation reussie', 'Le locataire a ete valide.');
              } catch (error) {
                showFeedback('Erreur', error instanceof Error ? error.message : 'Validation impossible.');
              }
            }}
            style={styles.actionButton}
          />
        ) : null}
        <KleaButton title="Supprimer ce locataire" variant="ghost" onPress={handleDelete} style={styles.actionButton} />
      </KleaCard>
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  sectionTitle: {
    color: KleaColors.secondary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  line: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  actionButton: {
    marginTop: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
  docsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  docItem: {
    width: '31%',
    minWidth: 120,
    gap: 6,
  },
  docLabel: {
    color: KleaColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  docImage: {
    width: '100%',
    height: 92,
    borderRadius: 10,
    backgroundColor: '#F3EEE6',
  },
  docEmpty: {
    color: KleaColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    paddingVertical: 6,
  },
});
