import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ConfidenceBadge, RomanUrduBadge, StatusPill } from '@/components/badges';
import { ThemedText } from '@/components/themed-text';
import { HoverPressable } from '@/components/ui/hover-pressable';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EmailMessage, ExtractedOrder, OrderItem } from '@/types/oms';

type Props = {
  email: EmailMessage;
  onApprove: (order: ExtractedOrder) => void;
  onReject: () => void;
  busy?: boolean;
};

function Field({
  label,
  value,
  confidence,
  onChange,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  confidence?: number;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        {confidence !== undefined && <ConfidenceBadge score={confidence} />}
      </View>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        placeholder="—"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          { color: theme.text, backgroundColor: theme.card, borderColor: theme.border },
        ]}
      />
    </View>
  );
}

function LineItemEditor({
  items,
  confidence,
  onChange,
}: {
  items: OrderItem[];
  confidence?: number;
  onChange: (items: OrderItem[]) => void;
}) {
  const theme = useTheme();

  const update = (index: number, patch: Partial<OrderItem>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <ThemedText type="small" themeColor="textSecondary">
          Line items ({items.length})
        </ThemedText>
        {confidence !== undefined && <ConfidenceBadge score={confidence} />}
      </View>

      {items.map((item, i) => (
        <View key={i} style={[styles.lineItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TextInput
            value={item.description}
            onChangeText={(v) => update(i, { description: v })}
            placeholder="Description"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, styles.lineItemDescription, { color: theme.text, borderColor: theme.border }]}
          />
          <View style={styles.lineItemNumbersRow}>
            <View style={styles.lineItemNumber}>
              <ThemedText type="small" themeColor="textSecondary">
                Qty
              </ThemedText>
              <TextInput
                value={String(item.quantity)}
                onChangeText={(v) => update(i, { quantity: Number(v.replace(/[^0-9]/g, '')) || 0 })}
                keyboardType="numeric"
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <View style={styles.lineItemNumber}>
              <ThemedText type="small" themeColor="textSecondary">
                Unit price
              </ThemedText>
              <TextInput
                value={item.unit_price === null ? '' : String(item.unit_price)}
                onChangeText={(v) => {
                  const n = Number(v.replace(/[^0-9.]/g, ''));
                  update(i, { unit_price: v === '' ? null : isNaN(n) ? null : n });
                }}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
            </View>
            <Pressable
              onPress={() => onChange(items.filter((_, idx) => idx !== i))}
              style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={16} color={theme.danger} />
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable
        onPress={() => onChange([...items, { description: '', quantity: 1, unit_price: null }])}
        style={[styles.addButton, { borderColor: theme.border }]}>
        <View style={styles.addInner}>
          <Ionicons name="add-circle" size={15} color={theme.primary} />
          <ThemedText type="small" style={{ color: theme.primary }}>
            Add item
          </ThemedText>
        </View>
      </Pressable>
    </View>
  );
}

/** Right pane: the editable AI-extracted order, ending in Approve/Reject. */
export function ExtractedFormPane({ email, onApprove, onReject, busy }: Props) {
  const theme = useTheme();
  const fc = email.field_confidence ?? {};
  const [order, setOrder] = useState<ExtractedOrder>(
    email.extraction ?? {
      customer_name: null,
      customer_email: null,
      order_items: [],
      total_amount: null,
      shipping_address: null,
    }
  );

  const patch = (p: Partial<ExtractedOrder>) => setOrder((o) => ({ ...o, ...p }));

  const itemsSubtotal = order.order_items.reduce(
    (sum, it) => sum + it.quantity * (it.unit_price ?? 0),
    0
  );

  const confirmReject = () => {
    if (Platform.OS === 'web') {
      // RN Alert is a no-op on web
      if (window.confirm('Reject this order?')) onReject();
    } else {
      Alert.alert('Reject order', 'Reject this order?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: onReject },
      ]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <ThemedText type="smallBold">Extracted order</ThemedText>
          {email.extraction?.was_roman_urdu && <RomanUrduBadge />}
        </View>
        <StatusPill status={email.status} />
      </Animated.View>

      <Field
        label="Customer name"
        value={order.customer_name ?? ''}
        confidence={fc.customer_name}
        onChange={(v) => patch({ customer_name: v || null })}
      />
      <Field
        label="Customer email"
        value={order.customer_email ?? ''}
        confidence={fc.customer_email}
        keyboardType="email-address"
        onChange={(v) => patch({ customer_email: v || null })}
      />
      <Field
        label="Shipping address"
        value={order.shipping_address ?? ''}
        confidence={fc.shipping_address}
        multiline
        onChange={(v) => patch({ shipping_address: v || null })}
      />

      <LineItemEditor
        items={order.order_items}
        confidence={fc.order_items}
        onChange={(order_items) => patch({ order_items })}
      />

      <Field
        label="Total amount"
        value={order.total_amount === null ? '' : String(order.total_amount)}
        confidence={fc.total_amount}
        keyboardType="numeric"
        onChange={(v) => {
          const n = Number(v.replace(/[^0-9.]/g, ''));
          patch({ total_amount: v === '' ? null : isNaN(n) ? null : n });
        }}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Line items subtotal: {itemsSubtotal.toLocaleString()}
        {order.total_amount !== null && itemsSubtotal !== order.total_amount && ' ⚠️ differs from total'}
      </ThemedText>

      {email.status === 'pending_review' && (
        <View style={styles.actionsRow}>
          <HoverPressable
            disabled={busy}
            onPress={confirmReject}
            pressScale={0.96}
            style={[styles.actionButton, { backgroundColor: theme.dangerBg }]}
            hoverStyle={{ borderColor: theme.danger, borderWidth: 1 }}>
            <ThemedText type="smallBold" style={{ color: theme.danger }}>
              Reject
            </ThemedText>
          </HoverPressable>
          <View style={styles.approveButton}>
            <HoverPressable
              disabled={busy}
              onPress={() => onApprove(order)}
              pressScale={0.96}
              style={[styles.actionButton, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}
              hoverStyle={{ opacity: 0.9 }}>
              <View style={styles.approveInner}>
                {!busy && <Ionicons name="checkmark-circle" size={16} color={theme.primaryText} />}
                <ThemedText type="smallBold" style={{ color: theme.primaryText }}>
                  {busy ? 'Submitting…' : 'Approve & Submit'}
                </ThemedText>
              </View>
            </HoverPressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  field: {
    gap: Spacing.one,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  lineItem: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  lineItemDescription: {
    borderWidth: 0,
    paddingHorizontal: 0,
    fontWeight: '600',
  },
  lineItemNumbersRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-end',
  },
  lineItemNumber: {
    flex: 1,
    gap: Spacing.half,
  },
  deleteButton: {
    padding: Spacing.two,
  },
  addButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Spacing.two,
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  addInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  approveInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  actionButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  approveButton: {
    flex: 1,
  },
});
