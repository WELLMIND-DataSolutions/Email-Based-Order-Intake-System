/**
 * Real API layer — talks to the FastAPI backend (rpa-engine).
 *
 * Function signatures mirror the Phase 2 mock layer 1:1 so screens/hooks
 * never touch wire shapes directly. IDs are backend integers on the wire,
 * strings on the frontend (matching EmailMessage.id / AuditEntry.id).
 */
import { API_BASE_URL } from '@/api/config';
import { getToken, setToken } from '@/state/auth';
import { AuditEntry, EmailLabel, EmailMessage, ExtractedOrder, ReviewStatus } from '@/types/oms';

interface ClassificationApi {
  predicted_label: EmailLabel;
  confidence: number;
  all_scores: Record<string, number>;
}

interface OrderItemApi {
  description: string;
  quantity: number;
  unit_price: number | null;
}

interface ExtractionApi {
  customer_name: string | null;
  customer_email: string | null;
  order_items: OrderItemApi[];
  total_amount: number | null;
  shipping_address: string | null;
  was_roman_urdu: boolean;
}

interface EmailApi {
  id: number;
  order_id: number | null;
  sender: string | null;
  sender_email: string | null;
  subject: string | null;
  body_text: string | null;
  received_at: string | null;
  source: string;
  classification: ClassificationApi;
  extraction: ExtractionApi | null;
  status: string;
}

interface AuditApi {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  actor: string;
  field?: string | null;
  ai_value?: string | null;
  human_value?: string | null;
  was_roman_urdu: boolean;
  created_at: string | null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    // Expired/invalid token — drop it so the AuthProvider gate sends the user back to /login.
    if (res.status === 401) setToken(null);
    const detail = await res.text().catch(() => '');
    throw new ApiError(res.status, `${res.status} ${res.statusText}${detail ? `: ${detail}` : ''}`);
  }
  return res.json();
}

/** Unauthenticated — no token to attach yet. Returns the JWT on success. */
async function authRequest(path: '/api/auth/login' | '/api/auth/signup', username: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new ApiError(res.status, `${res.status} ${res.statusText}${detail ? `: ${detail}` : ''}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

export function login(username: string, password: string): Promise<string> {
  return authRequest('/api/auth/login', username, password);
}

/** 409 (via ApiError.status) means the username is already taken. */
export function signup(username: string, password: string): Promise<string> {
  return authRequest('/api/auth/signup', username, password);
}

function toEmailMessage(e: EmailApi): EmailMessage {
  return {
    id: String(e.id),
    sender: e.sender ?? 'Unknown sender',
    sender_email: e.sender_email ?? e.sender ?? '',
    subject: e.subject ?? '(no subject)',
    body_text: e.body_text ?? '',
    received_at: e.received_at ?? new Date().toISOString(),
    source: (e.source as EmailMessage['source']) ?? 'sample',
    classification: e.classification,
    extraction: e.extraction,
    status: e.status as ReviewStatus,
    // Not served by the backend yet — attachments arrive with Phase 6 ingestion.
    attachments: [],
  };
}

const AUDIT_ACTION_MAP: Record<string, AuditEntry['action'] | undefined> = {
  edited: 'field_edited',
  approved: 'approved',
  rejected: 'rejected',
};

export async function fetchEmails(): Promise<EmailMessage[]> {
  const data = await request<EmailApi[]>('/api/emails');
  return data.map(toEmailMessage);
}

export async function fetchEmail(id: string): Promise<EmailMessage | undefined> {
  try {
    return toEmailMessage(await request<EmailApi>(`/api/emails/${id}`));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

/**
 * AuditOut has no email_subject (it logs against order/email entity ids, not
 * a denormalized subject) — join against /api/emails client-side. Only
 * order-level actions map to the dashboard's field_edited/approved/rejected
 * feed; "ingested"/"classified" email-level rows aren't shown here.
 */
export async function fetchAuditLog(): Promise<AuditEntry[]> {
  const [emails, audits] = await Promise.all([
    request<EmailApi[]>('/api/emails'),
    request<AuditApi[]>('/api/audit'),
  ]);
  const orderToEmail = new Map<number, EmailApi>();
  for (const e of emails) if (e.order_id != null) orderToEmail.set(e.order_id, e);

  const entries: AuditEntry[] = [];
  for (const a of audits) {
    if (a.entity_type !== 'order') continue;
    const action = AUDIT_ACTION_MAP[a.action];
    if (!action) continue;
    const email = orderToEmail.get(a.entity_id);
    entries.push({
      id: String(a.id),
      email_id: email ? String(email.id) : String(a.entity_id),
      email_subject: email?.subject ?? '(email unavailable)',
      action,
      field: a.field ?? undefined,
      ai_value: a.ai_value ?? undefined,
      human_value: a.human_value ?? undefined,
      was_roman_urdu: a.was_roman_urdu,
      created_at: a.created_at ?? new Date().toISOString(),
    });
  }
  return entries;
}

function toOrderUpdatePayload(extraction: ExtractedOrder) {
  return {
    customer_name: extraction.customer_name,
    customer_email: extraction.customer_email,
    order_items: extraction.order_items,
    total_amount: extraction.total_amount,
    shipping_address: extraction.shipping_address,
  };
}

async function getOrderId(emailId: string): Promise<number> {
  const email = await request<EmailApi>(`/api/emails/${emailId}`);
  if (email.order_id == null) throw new Error(`Email ${emailId} has no associated order`);
  return email.order_id;
}

export async function saveOrder(id: string, extraction: ExtractedOrder): Promise<EmailMessage> {
  const orderId = await getOrderId(id);
  const data = await request<EmailApi>(`/api/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(toOrderUpdatePayload(extraction)),
  });
  return toEmailMessage(data);
}

export async function approveOrder(id: string, extraction: ExtractedOrder): Promise<EmailMessage> {
  const orderId = await getOrderId(id);
  const data = await request<EmailApi>(`/api/orders/${orderId}/approve`, {
    method: 'POST',
    body: JSON.stringify(toOrderUpdatePayload(extraction)),
  });
  return toEmailMessage(data);
}

/** Backend only exposes reject as a state transition (no generic status setter). */
export async function setStatus(id: string, status: ReviewStatus): Promise<EmailMessage> {
  if (status !== 'rejected') {
    throw new Error(`setStatus(${status}) is not supported — approve via approveOrder()`);
  }
  const orderId = await getOrderId(id);
  const data = await request<EmailApi>(`/api/orders/${orderId}/reject`, { method: 'POST' });
  return toEmailMessage(data);
}
