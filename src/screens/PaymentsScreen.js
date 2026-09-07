import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSportsData } from '../context/SportsDataContext';
import { formatCurrency, getTeamCharge, PAYMENT_STATUSES } from '../utils/payments';

const formatMatchDate = (value) => new Date(value).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', weekday: 'short',
});

export default function PaymentsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const { matches, teams, updateMatch } = useSportsData();
  const [filter, setFilter] = useState('All');

  const completedMatches = useMemo(() => matches
    .filter((match) => match.status === 'Completed')
    .sort((a, b) => new Date(b.date) - new Date(a.date)), [matches]);

  const allCharges = useMemo(() => completedMatches.flatMap((match) =>
    ['team1', 'team2'].map((side) => {
      const teamId = match[`${side}Id`];
      return {
        key: `${match.id}|${teamId}`,
        match,
        side,
        team: teams.find((candidate) => candidate.id === teamId) || {
          id: teamId,
          name: match[`${side}Name`],
        },
        ...getTeamCharge(match, side),
      };
    })), [completedMatches, teams]);

  const charges = filter === 'All'
    ? allCharges
    : allCharges.filter((charge) => charge.status === filter);
  const total = allCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const paid = allCharges
    .filter((charge) => charge.status === PAYMENT_STATUSES.PAID)
    .reduce((sum, charge) => sum + charge.amount, 0);
  const pending = total - paid;
  const uniqueTeams = new Set(allCharges.map((charge) => charge.team.id)).size;

  const openInvoice = (matchId, teamId) => navigation.navigate('Invoice', { matchId, teamId });

  const markPaid = async (charge) => {
    try {
      await updateMatch(charge.match.id, {
        [`${charge.side}PaymentStatus`]: PAYMENT_STATUSES.PAID,
        [`${charge.side}PaidAt`]: new Date().toISOString(),
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to update payment status.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pageHeader}>
          <View style={styles.titleIcon}><Text style={styles.titleIconText}>₹</Text></View>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Payment Due</Text>
            <Text style={styles.subtitle}>Review match fees, send reminders and collect payments.</Text>
          </View>
          <View style={styles.headerSummary}>
            <View style={styles.headerStat}><Text style={styles.headerStatLabel}>Matches</Text><Text style={styles.headerStatValue}>{completedMatches.length}</Text></View>
            <View style={styles.headerStat}><Text style={styles.headerStatLabel}>Teams</Text><Text style={styles.headerStatValue}>{uniqueTeams}</Text></View>
            <View style={styles.headerStat}><Text style={styles.headerStatLabel}>Total</Text><Text style={styles.headerStatValue}>{formatCurrency(total)}</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Completed Matches</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchCardsRow}>
          {completedMatches.map((match) => {
            const team1Charge = getTeamCharge(match, 'team1');
            const team2Charge = getTeamCharge(match, 'team2');
            return (
              <View key={match.id} style={styles.matchCard}>
                <View style={styles.matchCardTop}>
                  <View><Text style={styles.matchDate}>{formatMatchDate(match.date)}</Text><Text style={styles.matchTime}>{match.time}</Text></View>
                  <Text style={styles.confirmed}>COMPLETED</Text>
                </View>
                <Text style={styles.venue}>{match.venue}</Text>
                {[['team1', match.team1Id, match.team1Name, team1Charge], ['team2', match.team2Id, match.team2Name, team2Charge]].map(([side, teamId, teamName, charge]) => (
                  <TouchableOpacity key={teamId} style={styles.matchTeamRow} onPress={() => openInvoice(match.id, teamId)}>
                    <View style={styles.matchTeamDetails}>
                      <Text style={styles.matchTeamName} numberOfLines={1}>{teamName}</Text>
                      <Text style={styles.matchTeamFee}>{formatCurrency(charge.amount)}</Text>
                    </View>
                    <Text style={[styles.statusPill, charge.status === PAYMENT_STATUSES.PAID ? styles.paidPill : styles.pendingPill]}>{charge.status}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.reminderButton} onPress={() => openInvoice(match.id, match.team1Id)}>
                  <Text style={styles.reminderButtonText}>Invoice & payment reminders</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          {completedMatches.length === 0 ? (
            <View style={styles.noMatches}><Text style={styles.noMatchesTitle}>No completed matches</Text><Text style={styles.noMatchesText}>Payment entries appear after a match is completed.</Text></View>
          ) : null}
        </ScrollView>

        <View style={[styles.detailsLayout, isWide && styles.detailsLayoutWide]}>
          <View style={[styles.feePanel, isWide && styles.feePanelWide]}>
            <View style={styles.panelHeadingRow}>
              <Text style={styles.panelTitle}>Match Fee Summary</Text>
              <View style={styles.filters}>
                {['All', PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.PAID].map((option) => (
                  <TouchableOpacity key={option} style={[styles.filter, filter === option && styles.filterActive]} onPress={() => setFilter(option)}>
                    <Text style={[styles.filterText, filter === option && styles.filterTextActive]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {isWide ? (
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.teamColumn]}>Team</Text>
                <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date & Time</Text>
                <Text style={[styles.tableHeaderText, styles.feeColumn]}>Match Fee</Text>
                <Text style={[styles.tableHeaderText, styles.statusColumn]}>Status</Text>
                <Text style={[styles.tableHeaderText, styles.actionColumn]}>Action</Text>
              </View>
            ) : null}
            {charges.map((charge) => (
              <View key={charge.key} style={[styles.feeRow, !isWide && styles.feeRowMobile]}>
                <View style={styles.teamColumn}><Text style={styles.feeTeam}>{charge.team.name}</Text><Text style={styles.feeMatch}>{charge.match.team1Name} vs {charge.match.team2Name}</Text></View>
                <Text style={styles.dateColumn}>{formatMatchDate(charge.match.date)}{isWide ? `\n${charge.match.time}` : ''}</Text>
                <Text style={styles.feeColumn}>{formatCurrency(charge.amount)}</Text>
                <Text style={[styles.statusPill, styles.statusColumn, charge.status === PAYMENT_STATUSES.PAID ? styles.paidPill : styles.pendingPill]}>{charge.status}</Text>
                <View style={styles.actionColumn}>
                  <TouchableOpacity onPress={() => openInvoice(charge.match.id, charge.team.id)}><Text style={styles.invoiceLink}>Invoice</Text></TouchableOpacity>
                  {charge.status !== PAYMENT_STATUSES.PAID ? <TouchableOpacity onPress={() => markPaid(charge)}><Text style={styles.markPaidLink}>Mark Paid</Text></TouchableOpacity> : null}
                </View>
              </View>
            ))}
          </View>

          <View style={[styles.overviewPanel, isWide && styles.overviewPanelWide]}>
            <Text style={styles.panelTitle}>Payment Overview</Text>
            <View style={styles.overviewRow}><Text style={styles.overviewLabel}>Total matches</Text><Text style={styles.overviewValue}>{completedMatches.length}</Text></View>
            <View style={styles.overviewRow}><Text style={styles.overviewLabel}>Team invoices</Text><Text style={styles.overviewValue}>{allCharges.length}</Text></View>
            <View style={styles.overviewRow}><Text style={styles.overviewLabel}>Total amount</Text><Text style={styles.overviewValue}>{formatCurrency(total)}</Text></View>
            <View style={styles.overviewRow}><Text style={[styles.overviewLabel, styles.green]}>Paid amount</Text><Text style={[styles.overviewValue, styles.green]}>{formatCurrency(paid)}</Text></View>
            <View style={styles.overviewRow}><Text style={[styles.overviewLabel, styles.red]}>Pending amount</Text><Text style={[styles.overviewValue, styles.red]}>{formatCurrency(pending)}</Text></View>
            <View style={styles.overviewDivider} />
            <View style={styles.totalDueRow}><Text style={styles.totalDueLabel}>Total Due</Text><Text style={styles.totalDue}>{formatCurrency(pending)}</Text></View>
            <Text style={styles.overviewHelp}>Open an invoice to scan the UPI QR or send its WhatsApp reminder.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7fb' }, content: { padding: 18, paddingBottom: 35 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14, backgroundColor: '#fff', padding: 18, borderRadius: 14 },
  titleIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#eee9ff', alignItems: 'center', justifyContent: 'center' }, titleIconText: { color: '#5b2be0', fontSize: 25, fontWeight: '900' },
  titleWrap: { flex: 1, minWidth: 220 }, title: { color: '#1d2033', fontSize: 25, fontWeight: '900' }, subtitle: { color: '#70738a', fontSize: 12, marginTop: 5 },
  headerSummary: { flexDirection: 'row', backgroundColor: '#faf8ff', borderWidth: 1, borderColor: '#e1d9ff', borderRadius: 10 },
  headerStat: { minWidth: 105, padding: 12, borderRightWidth: 1, borderRightColor: '#e8e2fa' }, headerStatLabel: { color: '#77768a', fontSize: 10 }, headerStatValue: { color: '#252438', fontSize: 14, fontWeight: '800', marginTop: 4 },
  sectionTitle: { color: '#252438', fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 10 }, matchCardsRow: { gap: 12, paddingBottom: 6 },
  matchCard: { width: 330, backgroundColor: '#fff', padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#6537ec' }, matchCardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  matchDate: { color: '#26263a', fontSize: 12, fontWeight: '800' }, matchTime: { color: '#696b7f', fontSize: 11, marginTop: 3 }, confirmed: { color: '#18763c', backgroundColor: '#e4f6e9', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, fontSize: 9, fontWeight: '800' },
  venue: { color: '#606276', fontSize: 11, marginVertical: 10 }, matchTeamRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f4', paddingVertical: 9 },
  matchTeamDetails: { flex: 1 }, matchTeamName: { color: '#3d20b3', fontSize: 12, fontWeight: '800' }, matchTeamFee: { color: '#777', fontSize: 10, marginTop: 2 },
  statusPill: { fontSize: 9, fontWeight: '800', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, textAlign: 'center' }, paidPill: { color: '#168447', backgroundColor: '#e3f5e8' }, pendingPill: { color: '#d32250', backgroundColor: '#fde8ed' },
  reminderButton: { borderTopWidth: 1, borderTopColor: '#eeeef2', paddingTop: 10, marginTop: 2 }, reminderButtonText: { color: '#4f2ed1', fontSize: 11, fontWeight: '700' },
  noMatches: { width: 330, padding: 30, backgroundColor: '#fff', borderRadius: 12 }, noMatchesTitle: { color: '#333', fontWeight: '800' }, noMatchesText: { color: '#888', fontSize: 11, marginTop: 5 },
  detailsLayout: { marginTop: 16, gap: 14 }, detailsLayoutWide: { flexDirection: 'row', alignItems: 'flex-start' }, feePanel: { backgroundColor: '#fff', borderRadius: 12, padding: 15 }, feePanelWide: { flex: 3 }, overviewPanel: { backgroundColor: '#fff', borderRadius: 12, padding: 17 }, overviewPanelWide: { flex: 1, minWidth: 280 },
  panelHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 9 }, panelTitle: { color: '#27263a', fontSize: 15, fontWeight: '900' }, filters: { flexDirection: 'row', gap: 5 }, filter: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#eeeef3' }, filterActive: { backgroundColor: '#5b2be0' }, filterText: { color: '#666', fontSize: 9, fontWeight: '800' }, filterTextActive: { color: '#fff' },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, marginTop: 10, backgroundColor: '#fafafd', borderBottomWidth: 1, borderBottomColor: '#e8e8ed' }, tableHeaderText: { color: '#6b6c7d', fontSize: 10, fontWeight: '800' },
  feeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#efeff3' }, feeRowMobile: { flexWrap: 'wrap', gap: 7 },
  teamColumn: { flex: 2, minWidth: 125 }, dateColumn: { flex: 1.5, minWidth: 105, color: '#55576a', fontSize: 10 }, feeColumn: { flex: 1, minWidth: 72, color: '#222338', fontSize: 11, fontWeight: '800' }, statusColumn: { flex: 1, minWidth: 70 }, actionColumn: { flex: 1, minWidth: 78, gap: 4 },
  feeTeam: { color: '#2d2850', fontSize: 11, fontWeight: '800' }, feeMatch: { color: '#8a8a99', fontSize: 9, marginTop: 3 }, invoiceLink: { color: '#5b2be0', fontSize: 10, fontWeight: '800' }, markPaidLink: { color: '#168447', fontSize: 9, fontWeight: '700' },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }, overviewLabel: { color: '#626377', fontSize: 11 }, overviewValue: { color: '#242538', fontSize: 12, fontWeight: '800' }, green: { color: '#168447' }, red: { color: '#d32250' }, overviewDivider: { height: 1, backgroundColor: '#e8e8ed', marginVertical: 17 }, totalDueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, totalDueLabel: { color: '#28293d', fontSize: 14, fontWeight: '800' }, totalDue: { color: '#d32250', fontSize: 23, fontWeight: '900' }, overviewHelp: { color: '#77798d', backgroundColor: '#f7f4ff', fontSize: 10, lineHeight: 15, padding: 10, borderRadius: 7, marginTop: 15 },
});
