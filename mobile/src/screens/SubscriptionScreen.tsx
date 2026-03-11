import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { subscriptionAPI } from '../lib/api';
import { SubscriptionPlan } from '../types';
import { COLORS } from '../lib/constants';

export default function SubscriptionScreen() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, currentRes] = await Promise.all([
          subscriptionAPI.getPlans(),
          subscriptionAPI.getMySubscription(),
        ]);
        setPlans(plansRes.data?.plans || []);
        setCurrentPlan(currentRes.data?.subscription || null);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [subscribing, setSubscribing] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    setSubscribing(planId);
    try {
      const response = await subscriptionAPI.initialize(planId);
      const paymentUrl = response.data?.authorization_url || response.data?.data?.authorization_url;
      if (paymentUrl) {
        await Linking.openURL(paymentUrl);
      } else {
        Alert.alert('Info', 'Subscription request sent. Check your email for payment link.');
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert('Error', error?.response?.data?.error || 'Failed to initialize subscription');
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure? You will still have access until the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await subscriptionAPI.cancel();
              setCurrentPlan((prev: any) => prev ? { ...prev, status: 'non_renewing' } : null);
              Alert.alert('Cancelled', 'Your subscription will not renew.');
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.error || 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const formatPrice = (price: number) => {
    return `\u20A6${(price / 100).toLocaleString()}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Subscription</Text>
        <Text style={styles.subtitle}>
          Choose a plan to access our entire catalog
        </Text>
      </View>

      {/* Current Plan */}
      {currentPlan && (
        <View style={styles.currentPlan}>
          <Text style={styles.currentPlanLabel}>Current Plan</Text>
          <Text style={styles.currentPlanName}>
            {currentPlan.plan?.name || 'Active'}
          </Text>
          <Text style={styles.currentPlanStatus}>
            Status: {currentPlan.status}
          </Text>
          {currentPlan.nextPaymentDate && (
            <Text style={styles.currentPlanDate}>
              Next billing: {new Date(currentPlan.nextPaymentDate).toLocaleDateString()}
            </Text>
          )}
          {currentPlan.status === 'active' && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelSubscription}>
              <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Plans */}
      {plans.map((plan) => (
        <View key={plan.id} style={styles.planCard}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPrice}>
            {formatPrice(plan.price)}
            <Text style={styles.planInterval}>/{plan.interval}</Text>
          </Text>
          {plan.description && (
            <Text style={styles.planDescription}>{plan.description}</Text>
          )}
          <View style={styles.features}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            {plan.maxBooksPerMonth && (
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>
                  {plan.maxBooksPerMonth} books per month
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.subscribeBtn,
              currentPlan?.planId === plan.id && styles.subscribeBtnActive,
            ]}
            onPress={() => handleSubscribe(plan.id)}
            disabled={currentPlan?.planId === plan.id || subscribing === plan.id}
          >
            {subscribing === plan.id ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.subscribeBtnText}>
                {currentPlan?.planId === plan.id ? 'Current Plan' : 'Subscribe'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ))}

      {plans.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No subscription plans available</Text>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  currentPlan: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  currentPlanLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  currentPlanStatus: {
    fontSize: 14,
    color: COLORS.success,
    marginTop: 4,
  },
  currentPlanDate: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  planCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 8,
  },
  planInterval: {
    fontSize: 14,
    fontWeight: 'normal',
    color: COLORS.textMuted,
  },
  planDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  features: {
    marginTop: 16,
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheck: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  subscribeBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  subscribeBtnActive: {
    backgroundColor: COLORS.surfaceLight,
  },
  subscribeBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  cancelBtnText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 16,
  },
});
