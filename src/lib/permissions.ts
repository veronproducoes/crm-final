export type Role = "ADMIN" | "COMERCIAL" | "FINANCEIRO";

// Mapa de permissões por módulo, conforme item 3.8 do briefing:
// Administrador: acesso total
// Comercial: Clientes, Kanban, Histórico, Agenda
// Financeiro: apenas consulta e exportações
export const permissions = {
  canEditClients: (role: Role) => role === "ADMIN" || role === "COMERCIAL",
  canDeleteClients: (role: Role) => role === "ADMIN",
  canMoveKanban: (role: Role) => role === "ADMIN" || role === "COMERCIAL",
  canManageColumns: (role: Role) => role === "ADMIN",
  canManageUsers: (role: Role) => role === "ADMIN",
  canToggleSubscriptions: (role: Role) => role === "ADMIN" || role === "COMERCIAL",
  canExportReports: (_role: Role) => true, // todos os perfis podem consultar/exportar
  canRunAIAnalysis: (role: Role) => role === "ADMIN" || role === "COMERCIAL",
  canViewFinance: (_role: Role) => true,
};

export function assertPermission(condition: boolean, message = "Sem permissão para esta ação.") {
  if (!condition) {
    const err: any = new Error(message);
    err.status = 403;
    throw err;
  }
}
