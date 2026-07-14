export default function PrivacidadePage() {
  return (
    <div className="max-w-2xl mx-auto p-8 text-[#171A2B]">
      <h1 className="text-2xl font-bold mb-4">Política de Privacidade</h1>
      <p className="mb-4 text-sm text-[#6B7086]">
        Este sistema armazena dados pessoais de contatos comerciais (nome, e-mail, telefone, endereço) para fins de
        relacionamento comercial entre a Veron Produções, a Arena 360 e seus clientes/leads, em conformidade com a
        Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
      </p>
      <h2 className="text-lg font-semibold mt-6 mb-2">Dados coletados</h2>
      <p className="mb-4 text-sm text-[#6B7086]">
        Nome do contato, empresa, telefone, WhatsApp, e-mail, endereço e cidade, informados pelo próprio titular ou por
        um representante da empresa contratante durante o relacionamento comercial.
      </p>
      <h2 className="text-lg font-semibold mt-6 mb-2">Direitos do titular</h2>
      <p className="mb-4 text-sm text-[#6B7086]">
        O titular dos dados pode solicitar a qualquer momento a exclusão, correção ou portabilidade de seus dados
        pessoais, entrando em contato com o responsável pelo tratamento de dados da empresa. Solicitações de exclusão
        devem ser direcionadas ao administrador do sistema, que executará a remoção via tela de Configurações ou
        diretamente no banco de dados.
      </p>
      <h2 className="text-lg font-semibold mt-6 mb-2">Controle de acesso</h2>
      <p className="mb-4 text-sm text-[#6B7086]">
        O acesso aos dados é restrito por perfil de usuário (Administrador, Comercial, Financeiro), cada um com
        permissões específicas, e todas as alterações relevantes ficam registradas em log de auditoria interno.
      </p>
    </div>
  );
}
