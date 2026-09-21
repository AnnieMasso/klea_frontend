import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AdminScreenShell } from '@/components/ui/admin-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { getAdminBailleurs, getAdminLocataires, getAdminSignalements, type AdminSignalement } from '@/utils/admin-api';
import { resolveImageSource } from '@/utils/local-photos';

export default function AdminSignalementsScreen() {
  const router = useRouter();
  const [signalements, setSignalements] = useState<AdminSignalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [namesById, setNamesById] = useState<Record<number, { nom: string; role: 'locataire' | 'bailleur' }>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [allSignalements, bailleurs, locataires] = await Promise.all([
          getAdminSignalements(),
          getAdminBailleurs(),
          getAdminLocataires(),
        ]);

        const names: Record<number, { nom: string; role: 'locataire' | 'bailleur' }> = {};
        bailleurs.forEach((row) => {
          names[row.bailleur.id] = {
            nom: `${row.bailleur.prenom ?? ''} ${row.bailleur.nom}`.trim() || row.bailleur.email,
            role: 'bailleur',
          };
        });
        locataires.forEach((row) => {
          names[row.locataire.id] = {
            nom: `${row.locataire.prenom ?? ''} ${row.locataire.nom}`.trim() || row.locataire.email,
            role: 'locataire',
          };
        });

        setNamesById(names);
        setSignalements(allSignalements);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const ordered = useMemo(
    () => [...signalements].sort((a, b) => Date.parse(b.created_at ?? '') - Date.parse(a.created_at ?? '')),
    [signalements],
  );

  return (
    <AdminScreenShell title="Signalements" subtitle="Remontees utilisateurs via API">
      {loading ? (
        <KleaCard><Text style={styles.emptyText}>Chargement...</Text></KleaCard>
      ) : null}

      {!loading && ordered.length === 0 ? (
        <KleaCard><Text style={styles.emptyText}>Aucun signalement enregistre.</Text></KleaCard>
      ) : null}

      {ordered.map((signalement) => {
        const auteur = namesById[signalement.plaignant_id];
        const cible = namesById[signalement.accuse_id];

        return (
          <KleaCard key={signalement.id} style={styles.card}>
            <Text style={styles.title}>Signalement utilisateur</Text>
            <Text style={styles.line}>Signaleur: {auteur?.nom ?? `Utilisateur ${signalement.plaignant_id}`}</Text>
            <Text style={styles.line}>Signale: {cible?.nom ?? `Utilisateur ${signalement.accuse_id}`}</Text>
            <Text style={styles.line}>{new Date(signalement.created_at ?? new Date().toISOString()).toLocaleString('fr-FR')}</Text>
            <Text style={styles.motif}>{signalement.motif}</Text>

            {(signalement.preuve1 || signalement.preuve2) ? (
              <View style={styles.preuvesRow}>
                {signalement.preuve1 ? (
                  <Image source={resolveImageSource(signalement.preuve1)} style={styles.preuveImage} resizeMode="cover" />
                ) : null}
                {signalement.preuve2 ? (
                  <Image source={resolveImageSource(signalement.preuve2)} style={styles.preuveImage} resizeMode="cover" />
                ) : null}
              </View>
            ) : null}

            {auteur ? (
              <KleaButton
                title="Voir le profil signaleur"
                variant="secondary"
                onPress={() => router.push((auteur.role === 'locataire' ? `/administrateur/locataire/${signalement.plaignant_id}` : `/administrateur/bailleur/${signalement.plaignant_id}`) as any)}
                style={styles.actionButton}
              />
            ) : null}

            {cible ? (
              <KleaButton
                title="Voir le profil signale"
                variant="secondary"
                onPress={() => router.push((cible.role === 'locataire' ? `/administrateur/locataire/${signalement.accuse_id}` : `/administrateur/bailleur/${signalement.accuse_id}`) as any)}
                style={styles.actionButton}
              />
            ) : null}
          </KleaCard>
        );
      })}
    </AdminScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 4,
  },
  title: {
    color: KleaColors.secondary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  line: {
    color: KleaColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  motif: {
    color: KleaColors.primary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  preuvesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  preuveImage: {
    width: 100,
    height: 100,
    borderRadius: KleaRadius.md,
  },
  actionButton: {
    marginTop: 8,
  },
  emptyText: {
    color: KleaColors.textMuted,
    fontSize: 13,
  },
});
