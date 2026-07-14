export type BrandDb = "VERON" | "ARENA360";
export type ActivityTypeDb =
  | "OBSERVACAO"
  | "LIGACAO"
  | "REUNIAO"
  | "VISITA"
  | "PROPOSTA"
  | "PENDENCIA"
  | "DESCARTADO";

export interface UserLite {
  id: string;
  name: string;
  email?: string;
  role?: "ADMIN" | "COMERCIAL" | "FINANCEIRO";
}

export interface KanbanColumnDto {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface EmailSubscriptionDto {
  id: string;
  clientId: string;
  brand: BrandDb;
  subscribed: boolean;
}

export interface ActivityDto {
  id: string;
  clientId: string;
  type: ActivityTypeDb;
  text: string;
  userId?: string | null;
  user?: { name: string } | null;
  createdAt: string;
}

export interface AIAnalysisDto {
  clientId: string;
  brandLabel: "Veron" | "Arena 360" | "Ambas" | "Indefinido";
  reasoning: string;
  analyzedAt: string;
}

export interface ClientDto {
  id: string;
  logoUrl?: string | null;
  company: string;
  contactName: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  brands: BrandDb[];
  origin?: string | null;
  favorite: boolean;
  position: number;
  responsibleId?: string | null;
  responsible?: UserLite | null;
  columnId: string;
  column?: KanbanColumnDto;
  createdAt: string;
  updatedAt: string;
  activities: ActivityDto[];
  subscriptions: EmailSubscriptionDto[];
  aiAnalysis?: AIAnalysisDto | null;
}

export interface TaskDto {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: "BAIXA" | "MEDIA" | "ALTA";
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA";
  responsibleId?: string | null;
  responsible?: UserLite | null;
  clientId?: string | null;
  client?: { id: string; company: string } | null;
  createdAt: string;
}
