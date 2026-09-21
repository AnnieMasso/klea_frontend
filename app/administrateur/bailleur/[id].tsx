import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { VerificationStatusBadge } from '@/components/ui/verification-status-badge';
import { KleaColors } from '@/constants/theme';
import { deleteAdminUser, getAdminBailleurs, validateAdminUser } from '@/utils/admin-api';
import { resolveImageSource } from '@/utils/local-photos';

export default function AdminBailleurDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const bailleurId = Number(typeof params.id === 'string' ? params.id : '0');

  const [row, setRow] = useState<Awaited<ReturnType<typeof getAdminBailleurs>>[number] | null>(null);

  const showFeedback = (title: string, message: string) => {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const refresh = async () => {
    try {
      const list = await getAdminBailleurs();
      setRow(list.find((item) => item.bailleur.id === bailleurId) ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger ce bailleur.';
      showFeedback('Erreur', message);
      setRow(null);
    }
  };

  useEffect(() => {
    if (!bailleurId) return;
    void refresh();
  }, [bailleurId]);

  const handleDelete = () => {
    if (!row) return;

    const confirmed = typeof window !== 'undefined'
      ? window.confirm('Supprimer ce bailleur ? Cette action est irreversible.')
      : true;

    if (!confirmed) return;

    void (async () => {
      try {
        await deleteAdminUser(row.bailleur.id);
        showFeedback('Suppression reussie', 'Le bailleur a ete supprime.');
        router.back();
      } catch (error) {
        showFeedback('Impossible', error instanceof Error ? error.message : 'Suppression refusee.');
      }
    })();
  };

  if (!row) {
    return (
      <AdminScreenShell title="Bailleur" subtitle="Introuvable">
        <KleaCard><Text style={styles.emptyText}>Ce bailleur est introuvable.</Text></KleaCard>
      </AdminScreenShell>
    );
  }

  const fullName = `${row.bailleur.prenom ?? ''} ${row.bailleur.nom}`.trim() || row.bailleur.email;
  const isVerified = row.bailleur.statut === 'actif';

  return (
    <AdminScreenShell title={fullName} subtitle={row.bailleur.email}>
      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Text style={styles.line}>{fullName}</Text>
        <Text style={styles.line}>{row.bailleur.email}</Text>
        <Text style={styles.line}>Nombre de biens: {row.biens.length}</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Statut:</Text>
          <VerificationStatusBadge verified={isVerified} />
        </View>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Documents fournis</Text>
        <View style={styles.docsGrid}>
          <View style={styles.docItem}>
            <Text style={styles.docLabel}>CNI recto</Text>
            {row.bailleur.cni_recto ? <Image source={resolveImageSource(row.bailleur.cni_recto)} style={styles.docImage} resizeMode="cover" /> : <Text style={styles.docEmpty}>Non fourni</Text>}
          </View>
          <View style={styles.docItem}>
            <Text style={styles.docLabel}>CNI verso</Text>
            {row.bailleur.cni_verso ? <Image source={resolveImageSource(row.bailleur.cni_verso)} style={styles.docImage} resizeMode="cover" /> : <Text style={styles.docEmpty}>Non fourni</Text>}
          </View>
          <View style={styles.docItem}>
            <Text style={styles.docLabel}>Assurance habitation</Text>
            {row.bailleur.assurance_habitation ? <Image source={resolveImageSource(row.bailleur.assurance_habitation)} style={styles.docImage} resizeMode="cover" /> : <Text style={styles.docEmpty}>Non fourni</Text>}
          </View>
        </View>
      </KleaCard>

      <KleaCard style={styles.card}>
        <Text style={styles.sectionTitle}>Biens ({row.biens.length})</Text>
        {row.biens.length === 0 ? <Text style={styles.emptyText}>Aucun bien pour ce bailleur.</Text> : null}
        {row.biens.map((bien) => (
          <View key={bien.id} style={styles.bienRow}>
            <View style={styles.bienInfo}>
              <Text style={styles.line}>{bien.titre}</Text>
              <Text style={styles.statusLine}>Statut du bien: {bien.statut}</Text>
            </View>
            <KleaButton title="Voir" variant="secondary" onPress={() => router.push(`/administrateur/bien/${bien.id}` as any)} />
          </View>
        ))}
      </KleaCard>

      <KleaCard style={styles.card}>
        {!isVerified ? (
          <KleaButton
            title="Valider"
            onPress={async () => {
              try {
                await validateAdminUser(row.bailleur.id);
                await refresh();
                showFeedback('Validation reussie', 'Le bailleur a ete valide.');
              } catch (error) {
                showFeedback('Erreur', error instanceof Error ? error.message : 'Validation impossible.');
              }
            }}
            style={styles.actionButton}
          />
        ) : null}
        <KleaButton title="Supprimer ce bailleur" variant="ghost" onPress={handleDelete} style={styles.actionButton} />
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
  statusLine: {
    color: KleaColors.secondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusLabel: {
    color: KleaColors.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  bienRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  bienInfo: {
    flex: 1,
    gap: 2,
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
