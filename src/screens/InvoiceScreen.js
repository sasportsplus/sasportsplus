import React from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSportsData } from '../context/SportsDataContext';
import {
  buildPaymentReminderMessage,
  buildWhatsAppUrl,
  formatCurrency,
  getInvoiceNumber,
  getTeamCharge,
  PAYMENT_PROFILE,
  PAYMENT_STATUSES,
} from '../utils/payments';

export default function InvoiceScreen({ route }) {
  const { matchId, teamId } = route.params;
  const { getMatchById, getTeamById, updateMatch } = useSportsData();
  const match = getMatchById(matchId);
  const team = getTeamById(teamId);

  if (!match || !team) {
    return <SafeAreaView style={styles.container}><Text style={styles.missing}>Invoice data was not found.</Text></SafeAreaView>;
  }

  const side = match.team1Id === teamId ? 'team1' : 'team2';
  const charge = getTeamCharge(match, side);
  const message = buildPaymentReminderMessage({ match, team, amount: charge.amount });

  const openWhatsApp = async () => {
    const url = buildWhatsAppUrl(team.whatsappNumber, message);
    if (!url) {
      Alert.alert('WhatsApp number missing', `Add a valid WhatsApp number to ${team.name} first.`);
      return;
    }
    try {
      await Linking.openURL(url);
      await updateMatch(match.id, { [`${side}ReminderSentAt`]: new Date().toISOString() });
    } catch (error) {
      Alert.alert('Unable to open WhatsApp', 'Check that WhatsApp is available and try again.');
    }
  };

  const markPaid = async () => updateMatch(match.id, {
    [`${side}PaymentStatus`]: PAYMENT_STATUSES.PAID,
    [`${side}PaidAt`]: new Date().toISOString(),
  });

  const shareInvoice = async () => {
    if (Platform.OS === 'web') {
      globalThis.print?.();
    } else {
      await Share.share({ message });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.invoice}>
          <Text style={styles.brand}>SANJAY SCHOOL SPORTS</Text>
          <Text style={styles.title}>MATCH FEE INVOICE</Text>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.label}>Invoice</Text><Text style={styles.value}>{getInvoiceNumber(match.id, team.id)}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Team</Text><Text style={styles.value}>{team.name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Match</Text><Text style={styles.value}>{match.team1Name} vs {match.team2Name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Date</Text><Text style={styles.value}>{new Date(match.date).toLocaleString()}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Venue</Text><Text style={styles.value}>{match.venue}</Text></View>
          <View style={styles.amountRow}><Text style={styles.amountLabel}>Amount Due</Text><Text style={styles.amount}>{formatCurrency(charge.amount)}</Text></View>
          <Text style={styles.payTo}>Pay to {PAYMENT_PROFILE.payeeName} · {PAYMENT_PROFILE.paymentPhone}</Text>
          <Image source={require('../../assets/priti-gupta-upi.jpeg')} style={styles.qr} resizeMode="contain" />
          <Text style={styles.scanText}>Scan using any UPI application</Text>
          <Text style={[styles.paymentStatus, charge.status === PAYMENT_STATUSES.PAID && styles.paymentStatusPaid]}>{charge.status}</Text>
        </View>
        <TouchableOpacity style={styles.whatsappButton} onPress={openWhatsApp}>
          <Text style={styles.actionText}>Open WhatsApp Reminder</Text>
        </TouchableOpacity>
        {charge.status !== PAYMENT_STATUSES.PAID ? (
          <TouchableOpacity style={styles.paidButton} onPress={markPaid}>
            <Text style={styles.actionText}>Mark as Paid</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.shareButton} onPress={shareInvoice}>
          <Text style={styles.shareText}>{Platform.OS === 'web' ? 'Print / Save Invoice' : 'Share Invoice Text'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f2f6' }, content: { padding: 16, paddingBottom: 35, alignItems: 'center' },
  invoice: { width: '100%', maxWidth: 650, backgroundColor: '#fff', borderRadius: 14, padding: 22 },
  brand: { color: '#5b2be0', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#222', fontSize: 24, fontWeight: '900', marginTop: 8 }, divider: { height: 1, backgroundColor: '#e4e4e8', marginVertical: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 10 }, label: { color: '#777', fontSize: 12 },
  value: { flex: 1, color: '#222', fontSize: 12, fontWeight: '700', textAlign: 'right' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f3efff', padding: 15, borderRadius: 9, marginTop: 8 },
  amountLabel: { color: '#4320a8', fontWeight: '800' }, amount: { color: '#5b2be0', fontSize: 22, fontWeight: '900' },
  payTo: { color: '#555', textAlign: 'center', fontSize: 12, marginTop: 18 }, qr: { width: 280, height: 360, alignSelf: 'center', marginTop: 8 },
  scanText: { color: '#777', fontSize: 11, textAlign: 'center' },
  paymentStatus: { alignSelf: 'center', color: '#c62828', backgroundColor: '#fde7e7', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 14, fontWeight: '800', marginTop: 12 },
  paymentStatusPaid: { color: '#168447', backgroundColor: '#e4f6ea' },
  whatsappButton: { width: '100%', maxWidth: 650, backgroundColor: '#20a958', padding: 14, borderRadius: 9, alignItems: 'center', marginTop: 12 },
  paidButton: { width: '100%', maxWidth: 650, backgroundColor: '#5b2be0', padding: 14, borderRadius: 9, alignItems: 'center', marginTop: 9 },
  actionText: { color: '#fff', fontWeight: '800' }, shareButton: { width: '100%', maxWidth: 650, borderWidth: 1, borderColor: '#5b2be0', padding: 13, borderRadius: 9, alignItems: 'center', marginTop: 9 },
  shareText: { color: '#5b2be0', fontWeight: '800' }, missing: { padding: 30, color: '#777', textAlign: 'center' },
});
