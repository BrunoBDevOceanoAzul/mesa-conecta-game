import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import logoImg from "@/assets/hivium-logo.png";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 py-4">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2">
            <img src={logoImg.src} alt="HIVIUM" className="h-8 w-8 object-contain" />
            <span className="font-display font-bold text-sm gradient-text">HIVIUM</span>
          </button>
          <button onClick={() => navigate(-1)} className="ml-auto text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl prose prose-sm dark:prose-invert">
        <h1>Termos de Prestação de Serviço — HIVIUM</h1>
        <p className="text-muted-foreground text-xs">Última atualização: Março de 2026</p>

        <h2>1. Das Partes e do Objeto</h2>
        <p>
          Os presentes Termos de Prestação de Serviço ("Termos") regulam a relação entre a <strong>BFF COMERCIO E SERVICOS LTDA - ME</strong> (CNPJ 35.295.043/0001-26), doravante denominada "HIVIUM", e o usuário da plataforma ("Usuário"), que poderá atuar nos perfis de Jogador, Mestre/Organizador (Host) ou Lojista.
        </p>
        <p>
          A HIVIUM é uma plataforma digital de intermediação e conexão para a comunidade de jogos de mesa (RPG, Board Games e afins), oferecendo funcionalidades de busca, agendamento, matchmaking, pagamentos e gestão de mesas e eventos.
        </p>

        <h2>2. Cadastro e Aceitação</h2>
        <p>
          Ao se cadastrar na HIVIUM, o Usuário declara ter pelo menos 16 (dezesseis) anos de idade e concorda integralmente com estes Termos, com a Política de Privacidade e com quaisquer regras complementares publicadas na plataforma. O cadastro é pessoal e intransferível.
        </p>

        <h2>3. Perfis de Usuário</h2>
        <ul>
          <li><strong>Jogador:</strong> Pode buscar, reservar e participar de mesas publicadas na plataforma.</li>
          <li><strong>Mestre/Organizador (Host):</strong> Pode criar, gerenciar e narrar mesas, definindo preços, datas e regras de participação.</li>
          <li><strong>Lojista:</strong> Pode cadastrar espaço físico, hospedar mesas e organizar eventos na plataforma.</li>
        </ul>

        <h2>4. Funcionamento da Plataforma</h2>
        <p>
          A HIVIUM atua exclusivamente como <strong>intermediadora tecnológica</strong>. A plataforma conecta Jogadores a Mestres e Lojistas, mas não é parte na relação de prestação de serviço entre eles. A HIVIUM não se responsabiliza pela qualidade, pontualidade ou condução das sessões de jogo.
        </p>

        <h2>5. Pagamentos, Taxas e Repasses</h2>
        <ul>
          <li>O processamento de pagamentos é realizado por gateway terceirizado (Stripe), em ambiente seguro e tokenizado.</li>
          <li>A HIVIUM cobra uma taxa de intermediação sobre cada transação realizada na plataforma, conforme descrito na página de planos vigente.</li>
          <li>Repasses aos Mestres e Lojistas ocorrem conforme os prazos estabelecidos pelo processador de pagamentos e pelo plano contratado.</li>
          <li>A HIVIUM não se responsabiliza por disputas financeiras entre Jogadores e Hosts que ocorram fora da plataforma.</li>
        </ul>

        <h2>6. Planos e Assinaturas</h2>
        <p>
          A HIVIUM oferece planos gratuitos e pagos para cada perfil de usuário. As funcionalidades, limites e benefícios de cada plano estão descritos na página de planos da plataforma. A HIVIUM reserva-se o direito de alterar preços e funcionalidades dos planos, notificando os usuários com antecedência mínima de 30 dias.
        </p>

        <h2>7. Cancelamento e Reembolso</h2>
        <ul>
          <li>O Jogador pode cancelar uma reserva conforme a política de cancelamento definida pelo Host da mesa.</li>
          <li>Assinaturas de planos pagos podem ser canceladas a qualquer momento, com efeito ao final do período já pago.</li>
          <li>Reembolsos de reservas seguem a política de cancelamento específica de cada mesa e os prazos legais do Código de Defesa do Consumidor.</li>
        </ul>

        <h2>8. Conduta do Usuário</h2>
        <p>O Usuário compromete-se a:</p>
        <ul>
          <li>Utilizar a plataforma de boa-fé e com respeito aos demais usuários;</li>
          <li>Não publicar conteúdo ofensivo, discriminatório, ilegal ou que viole direitos de terceiros;</li>
          <li>Não utilizar a plataforma para fins comerciais não autorizados ou spam;</li>
          <li>Manter suas informações cadastrais atualizadas e verídicas.</li>
        </ul>
        <p>
          A HIVIUM reserva-se o direito de suspender ou excluir contas que violem estes Termos, sem necessidade de aviso prévio em casos graves.
        </p>

        <h2>9. Propriedade Intelectual</h2>
        <p>
          Todo o conteúdo da plataforma (marca, logotipo, layout, código-fonte, textos, imagens e funcionalidades) é de propriedade exclusiva da HIVIUM ou de seus licenciadores. O Usuário não adquire qualquer direito de propriedade intelectual sobre a plataforma ao utilizá-la.
        </p>

        <h2>10. Limitação de Responsabilidade</h2>
        <ul>
          <li>A HIVIUM não garante disponibilidade ininterrupta da plataforma, podendo haver manutenções programadas ou indisponibilidades temporárias.</li>
          <li>A HIVIUM não se responsabiliza por danos indiretos, lucros cessantes ou perda de dados decorrentes do uso da plataforma, exceto nos limites legais.</li>
          <li>A responsabilidade total da HIVIUM em qualquer disputa limita-se ao valor efetivamente pago pelo Usuário nos últimos 12 meses.</li>
        </ul>

        <h2>11. Tratamento de Dados Pessoais</h2>
        <p>
          O tratamento de dados pessoais realizado pela HIVIUM está detalhado na <a href="/privacidade" className="text-primary hover:underline">Política de Privacidade</a>, que é parte integrante destes Termos. A HIVIUM utiliza autenticação via Google OAuth, coletando apenas nome, e-mail e foto de perfil conforme autorizado na tela de consentimento do Google. Os dados são processados em conformidade com a LGPD.
        </p>

        <h2>12. Disposições Gerais</h2>
        <ul>
          <li>Estes Termos são regidos pelas leis da República Federativa do Brasil.</li>
          <li>O foro competente para dirimir quaisquer controvérsias é o da Comarca de Campinas - SP.</li>
          <li>A tolerância de uma parte quanto ao descumprimento de qualquer cláusula não implica renúncia ao direito de exigir seu cumprimento.</li>
          <li>Caso qualquer disposição destes Termos seja considerada inválida, as demais permanecerão em pleno vigor.</li>
        </ul>

        <h2>13. Alterações destes Termos</h2>
        <p>
          A HIVIUM poderá atualizar estes Termos a qualquer momento. Alterações substanciais serão comunicadas aos usuários por e-mail ou notificação na plataforma com antecedência mínima de 30 dias. A continuidade do uso após a publicação de alterações implica aceitação tácita dos novos termos.
        </p>

        <h2>14. Contato</h2>
        <p>
          Para dúvidas, sugestões ou reclamações: <strong>contato@hivium.com.br</strong>
        </p>
      </main>
    </div>
  );
}
