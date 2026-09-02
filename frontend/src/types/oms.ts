/**
 * Data contract mirroring the Phase 1 backend (rpa-engine).
 *
 * Classification shape = app/ai/classifier.py classify_email() return value.
 * ExtractedOrder / OrderItem = app/ai/schemas.py Pydantic models.
 * field_confidence is a dashboard-side extension the backend can add later —
 * every consumer treats it as optional.
 */

export type EmailLabel = 'Order' | 'Inquiry' | 'Support' | 'Spam';

export type ReviewStatus = 'pending_review' | 'approved' | 'rejected';

export interface Classification {
  predicted_label: EmailLabel;
  confidence: number;
  all_scores: Record<string, number>;
}

export interface OrderItem {
  description: string;
  quantity: number;
  unit_price: number | null;
}

export interface ExtractedOrder {
  customer_name: string | null;
  customer_email: string | null;
  order_items: OrderItem[];
  total_amount: number | null;
  shipping_address: string | null;
  /** Set by the backend extractor when the Roman Urdu few-shot path ran. */
  was_roman_urdu?: boolean;
}

/**
 * One human correction of an AI-extracted field — the raw material of the
 * active-learning loop (blueprint Unique Feature 3, Step A).
 */
export interface AuditEntry {
  id: string;
  email_id: string;
  email_subject: string;
  action: 'field_edited' | 'approved' | 'rejected';
  field?: string;
  ai_value?: string;
  human_value?: string;
  was_roman_urdu: boolean;
  created_at: string; // ISO 8601
}

export interface Attachment {
  id: string;
  filename: string;
  kind: 'image' | 'pdf';
  /** Bundled asset for mock fixtures; a URL once the real API is wired in. */
  source?: number | string;
}

export interface EmailMessage {
  id: string;
  sender: string;
  sender_email: string;
  subject: string;
  body_text: string;
  received_at: string; // ISO 8601
  source: 'sample' | 'gmail' | 'imap';
  classification: Classification;
  extraction: ExtractedOrder | null;
  field_confidence?: Record<string, number>;
  status: ReviewStatus;
  attachments: Attachment[];
}
