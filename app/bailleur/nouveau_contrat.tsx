import { Picker } from '@react-native-picker/picker';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { BailleurScreenShell } from '@/components/ui/bailleur-screen-shell';
import { KleaButton } from '@/components/ui/klea-button';
import { KleaCard } from '@/components/ui/klea-card';
import { KleaInput } from '@/components/ui/klea-input';
import { KleaColors, KleaRadius } from '@/constants/theme';
import { createContratForBien, getBiens, type BienDetail } from '@/utils/biens-store';

export default function NouveauContratScreen() {
	const biens = useMemo(() => getBiens(), []);
	const [bienId, setBienId] = useState<string>(biens[0]?.id ?? '');
	const [locataire, setLocataire] = useState('');
	const [montant, setMontant] = useState('');
	const [dureeMois, setDureeMois] = useState('12');
	const [conditions, setConditions] = useState('Caution: 2 mois\nPaiement mensuel avant le 5');

	const selectedBien: BienDetail | undefined = biens.find((item) => item.id === bienId);

	const onSubmit = () => {
		if (!selectedBien) {
			Alert.alert('Bien manquant', 'Selectionnez un bien.');
			return;
		}
		if (!locataire.trim()) {
			Alert.alert('Locataire manquant', 'Le nom du locataire est obligatoire.');
			return;
		}

		const ok = createContratForBien(selectedBien.id, {
			locataire: locataire.trim(),
			montant: Number(montant.replace(/\D/g, '')) || selectedBien.montant,
			dureeMois: Number(dureeMois.replace(/\D/g, '')) || 12,
			conditions: conditions
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean),
			signerMaintenant: true,
		});

		if (ok) {
			Alert.alert('Contrat cree', 'Le contrat a ete cree et signe.');
			setLocataire('');
			setMontant('');
			setDureeMois('12');
		}
	};

	return (
		<BailleurScreenShell title="Nouveau contrat" subtitle="Creer un contrat selon des conditions puis signer">

					<KleaCard>
						<Text style={styles.label}>Bien concerne</Text>
						<View style={styles.pickerWrap}>
							<Picker selectedValue={bienId} onValueChange={(value) => setBienId(value)} style={styles.picker}>
								{biens.map((item) => (
									<Picker.Item key={item.id} label={item.titre} value={item.id} />
								))}
							</Picker>
						</View>

						<KleaInput label="Locataire" value={locataire} onChangeText={setLocataire} />
						<KleaInput
							label="Montant"
							keyboardType="numeric"
							value={montant}
							onChangeText={(value) => setMontant(value.replace(/\D/g, ''))}
						/>
						<KleaInput
							label="Duree du contrat (mois)"
							keyboardType="numeric"
							value={dureeMois}
							onChangeText={(value) => setDureeMois(value.replace(/\D/g, ''))}
						/>
						<KleaInput
							label="Conditions (une ligne = une condition)"
							multiline
							numberOfLines={5}
							value={conditions}
							onChangeText={setConditions}
						/>

						<KleaButton title="Creer et signer" onPress={onSubmit} icon="create-outline" iconPosition="right" />
					</KleaCard>
		</BailleurScreenShell>
	);
}

const styles = StyleSheet.create({
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
});
