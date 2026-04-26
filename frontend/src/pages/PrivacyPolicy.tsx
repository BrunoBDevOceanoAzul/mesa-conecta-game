import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logoImg from "@/assets/hivium-logo.png";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 py-4">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2">
            <img src={logoImg} alt="HIVIUM" className="h-8 w-8 object-contain" />
            <span className="font-display font-bold text-sm gradient-text">HIVIUM</span>
          </button>
          <button onClick={() => navigate(-1)} className="ml-auto text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl prose prose-sm dark:prose-invert">
        <h1>Política de Privacidade — HIVIUM</h1>
        <p className="text-muted-foreground text-xs">Última atualização: Março de 2026</p>

        <h2>1. Introdução</h2>
        <p>
          A presente Política de Privacidade tem por finalidade informar de maneira clara, transparente e objetiva como a plataforma HIVIUM (anteriormente "Sócio do Tabuleiro") realiza o tratamento dos dados pessoais dos usuários (Jogadores, Mestres/Organizadores e Lojistas) que acessam ou utilizam a nossa infraestrutura, em estrita conformidade com a Lei nº 13.709/2018 – Lei Geral de Proteção de Dados Pessoais ("LGPD"), o Marco Civil da Internet (Lei nº 12.965/2014) e demais normas aplicáveis.
        </p>
        <p>
          Ao utilizar a HIVIUM, o usuário declara ter lido, compreendido e concordado expressamente com os termos desta Política de Privacidade.
        </p>

        <h2>2. Controlador e Dados de Contato</h2>
        <p>A controladora dos dados pessoais tratados no âmbito das operações gerais desta plataforma é:</p>
        <ul>
          <li>Razão social: BFF COMERCIO E SERVICOS LTDA - ME</li>
          <li>Nome Fantasia: HIVIUM</li>
          <li>CNPJ: 35.295.043/0001-26</li>
          <li>Sede: Campinas - São Paulo (SP)</li>
        </ul>
        <p>
          Em caso de dúvidas, solicitações ou reclamações relacionadas à privacidade e proteção de dados, o usuário poderá contatar o nosso Encarregado pelo Tratamento de Dados Pessoais (DPO) através do e-mail: <strong>privacidade@hivium.com.br</strong>.
        </p>

        <h2>3. Categorias de Dados Pessoais Coletados</h2>
        <p>A HIVIUM poderá coletar e tratar as seguintes categorias de dados pessoais, limitadas ao mínimo necessário para a operação:</p>
        <ul>
          <li><strong>Dados cadastrais:</strong> Nome completo, e-mail, telefone (WhatsApp), senha (armazenada em formato de hash criptográfico), foto de perfil e faixa etária.</li>
          <li><strong>Dados de autenticação (SSO/OAuth):</strong> Caso o usuário utilize serviços de terceiros (ex: Google), receberemos dados básicos autorizados na tela de consentimento (nome, e-mail e foto). Não acessamos listas de contatos ou conteúdos de e-mail.</li>
          <li><strong>Dados financeiros e de faturamento:</strong> CPF/CNPJ, endereço de cobrança e dados de pagamento (processados de forma tokenizada via parceiros homologados pelo Banco Central). A HIVIUM não armazena os números completos de cartão de crédito em seus servidores.</li>
          <li><strong>Dados de navegação e uso (Logs):</strong> Endereço IP, data e hora de acesso, tipo de navegador, identificadores de dispositivo e histórico de ações na plataforma (visando a segurança e o cumprimento do Art. 15 do Marco Civil da Internet).</li>
        </ul>

        <h2>4. Finalidades do Tratamento</h2>
        <p>Os dados coletados são tratados para as seguintes finalidades legítimas:</p>
        <ul>
          <li><strong>Execução dos Serviços:</strong> Gestão de cadastro, agendamento de mesas, matchmaking entre jogadores e hosts, e operação da infraestrutura da plataforma.</li>
          <li><strong>Processamento Financeiro:</strong> Cobrança de ingressos, repasse de valores aos Hosts/Lojistas, emissão de notas fiscais e prevenção a fraudes financeiras.</li>
          <li><strong>Comunicação e Suporte:</strong> Envio de notificações sobre agendamentos, atendimento a chamados técnicos e moderação de conflitos.</li>
          <li><strong>Segurança da Informação:</strong> Monitoramento de atividades suspeitas para proteger a integridade da plataforma e dos próprios usuários.</li>
        </ul>

        <h2>5. Bases Legais</h2>
        <p>O tratamento de dados pessoais na HIVIUM fundamenta-se nas seguintes bases legais (Art. 7º e Art. 11 da LGPD):</p>
        <ul>
          <li><strong>Execução de Contrato:</strong> Para o fornecimento da plataforma e processamento de reservas (Art. 7º, V).</li>
          <li><strong>Cumprimento de Obrigação Legal/Regulatória:</strong> Para retenção de logs de acesso e emissão de documentos fiscais (Art. 7º, II).</li>
          <li><strong>Consentimento:</strong> Para o envio de marketing direto (Art. 11, I).</li>
          <li><strong>Legítimo Interesse:</strong> Para melhorias contínuas do sistema e prevenção a fraudes, respeitados os direitos fundamentais dos usuários (Art. 7º, IX).</li>
        </ul>

        <h2>6. Compartilhamento de Dados Pessoais</h2>
        <p>A HIVIUM não comercializa ou vende dados pessoais. O compartilhamento ocorre estritamente com:</p>
        <ul>
          <li><strong>Meios de Pagamento:</strong> Processadores e gateways de pagamento para a efetivação das transações.</li>
          <li><strong>Provedores de Infraestrutura:</strong> Serviços de hospedagem em nuvem (cloud) com servidores seguros e provedores de envio de e-mail/SMS transacionais.</li>
          <li><strong>Autoridades Públicas:</strong> Apenas mediante ordem judicial ou obrigação legal estrita.</li>
        </ul>

        <h2>7. Cookies e Tecnologias de Rastreamento</h2>
        <p>
          Utilizamos cookies estritamente necessários para manter a sessão do usuário ativa e segura. Cookies de análise e marketing poderão ser utilizados apenas com o consentimento prévio do usuário (via banner de cookies), podendo ser revogados a qualquer momento nas configurações do navegador.
        </p>

        <h2>8. Retenção e Descarte de Dados</h2>
        <p>
          Os dados pessoais serão mantidos pelo tempo necessário para cumprir a finalidade para a qual foram coletados. O usuário pode solicitar a exclusão de sua conta a qualquer momento. Contudo, a HIVIUM reserva-se o direito de reter dados financeiros por 5 (cinco) anos para fins de auditoria contábil/fiscal, e registros de acesso (logs IP) por 6 (seis) meses, conforme exige o Marco Civil da Internet. Esgotados os prazos legais, os dados serão deletados ou anonimizados.
        </p>

        <h2>9. Medidas de Segurança</h2>
        <p>
          Adotamos protocolos rigorosos de segurança da informação, incluindo firewalls, criptografia de dados em trânsito (SSL/TLS) e em repouso, além de controle de acesso estrito aos nossos servidores. Apesar de nossos melhores esforços, o usuário entende que nenhuma transmissão na internet é 100% segura, cabendo a ele proteger suas credenciais de acesso.
        </p>

        <h2>10. Direitos dos Titulares de Dados (Usuários)</h2>
        <p>Em conformidade com o Art. 18 da LGPD, o usuário pode solicitar a qualquer momento:</p>
        <ul>
          <li>A confirmação da existência de tratamento;</li>
          <li>O acesso, correção ou atualização de seus dados;</li>
          <li>A anonimização, bloqueio ou eliminação de dados desnecessários;</li>
          <li>A portabilidade de seus dados;</li>
          <li>A revogação de consentimentos previamente concedidos.</li>
        </ul>
        <p>As requisições devem ser enviadas ao e-mail oficial de privacidade, com prazo legal de resposta de até 15 (quinze) dias.</p>

        <h2>11. Transferência Internacional de Dados</h2>
        <p>
          Nossos servidores de nuvem podem estar localizados fora do Brasil (ex: Estados Unidos). Nesses casos, a HIVIUM garante que as transferências internacionais ocorrerão apenas para países ou empresas parceiras que proporcionem grau de proteção de dados adequado ou que assinem cláusulas contratuais padrão alinhadas à LGPD.
        </p>

        <h2>12. Alterações desta Política</h2>
        <p>
          A HIVIUM poderá atualizar esta Política de Privacidade a qualquer momento. Alterações substanciais serão comunicadas aos usuários por e-mail ou notificação na plataforma. A continuidade do uso após a publicação de alterações implica aceitação tácita dos novos termos.
        </p>
      </main>
    </div>
  );
}
