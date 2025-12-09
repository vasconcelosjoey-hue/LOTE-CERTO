import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PackageCheck, 
  ScanBarcode, 
  BrainCircuit, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  BarChart3,
  Smartphone,
  CheckCircle2,
  Mail,
  MapPin,
  Phone
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleAccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* HEADER / NAV */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-slate-900 text-white p-2 rounded-lg">
                <PackageCheck className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                LOTE<span className="font-light text-slate-500">CERTO</span>
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
              <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
              <a href="#beneficios" className="hover:text-blue-600 transition-colors">Benefícios</a>
              <a href="#contato" className="hover:text-blue-600 transition-colors">Contato</a>
            </div>
            <button 
              onClick={handleAccess}
              className="bg-slate-900 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
            >
              Acessar Sistema
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6 border border-blue-100">
            <Zap className="w-3 h-3" /> Nova Versão com IA 2.0
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            O fim do prejuízo com <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              produtos vencidos.
            </span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500 mb-10 leading-relaxed">
            Utilize Inteligência Artificial para auditar estoques farmacêuticos em segundos. 
            Controle validades, evite multas da ANVISA e otimize suas compras.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={handleAccess}
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 group"
            >
              Começar Agora
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#funcionalidades" className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center">
              Saber mais
            </a>
          </div>

          {/* Abstract Visual */}
          <div className="mt-16 relative max-w-5xl mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4">
                  <ScanBarcode className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-bold text-slate-900">Auditoria Rápida</h3>
                <p className="text-slate-500 text-sm mt-2">Escaneie códigos e deixe a IA ler lote e validade automaticamente.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-bold text-slate-900">Gestão Preventiva</h3>
                <p className="text-slate-500 text-sm mt-2">Alertas automáticos de vencimento (D-90, D-30) e cálculo de risco.</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                  <BrainCircuit className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-bold text-slate-900">Compra Inteligente</h3>
                <p className="text-slate-500 text-sm mt-2">Sugestões de reposição baseadas no giro real e risco de ruptura.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="funcionalidades" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-4">Tecnologia que trabalha por você</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              O Lote Certo substitui planilhas manuais e conferências visuais por um sistema automatizado de visão computacional.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Scanner Mobile Universal</h3>
                  <p className="text-slate-500 mt-2">
                    Funciona em qualquer smartphone. Nossa IA reconhece códigos de barras, Datamatrix e QR Codes, extraindo datas mesmo em embalagens difíceis.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Compliance & Segurança</h3>
                  <p className="text-slate-500 mt-2">
                    Evite multas sanitárias. Tenha o histórico completo de rastreabilidade de cada lote, corredor e prateleira auditada.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Zero Desperdício</h3>
                  <p className="text-slate-500 mt-2">
                    Transforme prejuízo em promoção. Identifique produtos próximos ao vencimento com tempo hábil para realizar ações de vendas.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl transform rotate-3 scale-105 opacity-20"></div>
              <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 relative">
                {/* Mockup UI representation */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">Dashboard Preview</span>
                  </div>
                  <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-4">
                     <div className="bg-white p-2 rounded-lg text-red-500 shadow-sm">
                       <ScanBarcode className="w-6 h-6" />
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-800 text-sm">Alerta Crítico</h4>
                       <p className="text-xs text-slate-500">Amoxicilina vence em 15 dias.</p>
                     </div>
                     <button className="ml-auto text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg">Ver</button>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
                     <div className="bg-white p-2 rounded-lg text-blue-500 shadow-sm">
                       <TrendingUp className="w-6 h-6" />
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-800 text-sm">Sugestão de Compra</h4>
                       <p className="text-xs text-slate-500">Dipirona: Estoque baixo, giro alto.</p>
                     </div>
                  </div>
                  <div className="h-32 bg-slate-100 rounded-xl w-full flex items-center justify-center text-slate-400 text-xs">
                    Gráfico de Perdas Evitadas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS (Stats) */}
      <section id="beneficios" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6">
              <div className="text-4xl font-black text-blue-400 mb-2">+30%</div>
              <div className="text-slate-400 font-medium">Recuperação de Receita</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-black text-blue-400 mb-2">-80%</div>
              <div className="text-slate-400 font-medium">Tempo de Auditoria</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-black text-blue-400 mb-2">100%</div>
              <div className="text-slate-400 font-medium">Controle de Lotes</div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-black text-blue-400 mb-2">24/7</div>
              <div className="text-slate-400 font-medium">Monitoramento</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-black text-slate-900 mb-6">Pronto para otimizar seu estoque?</h2>
          <p className="text-lg text-slate-500 mb-10">
            Junte-se a farmácias e hospitais que já estão economizando com o Lote Certo.
            Acesse agora a versão MVP.
          </p>
          <button 
            onClick={handleAccess}
            className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-bold text-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
          >
            Acessar Plataforma Grátis
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contato" className="bg-slate-50 border-t border-slate-200 py-12 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <PackageCheck className="w-5 h-5 text-slate-900" />
                <span className="font-bold text-slate-900">LOTE CERTO</span>
              </div>
              <p className="text-slate-500 max-w-xs">
                Soluções inteligentes para controle de validade e gestão de estoque farmacêutico.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Produto</h4>
              <ul className="space-y-2 text-slate-500">
                <li><a href="#" className="hover:text-blue-600">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-blue-600">Para Farmácias</a></li>
                <li><a href="#" className="hover:text-blue-600">Para Hospitais</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4">Contato</h4>
              <ul className="space-y-2 text-slate-500">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4"/> contato@lotecerto.com.br</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4"/> (11) 99999-9999</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4"/> São Paulo, SP</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-400">
            <p>&copy; 2024 Lote Certo. Todos os direitos reservados.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-600">Privacidade</a>
              <a href="#" className="hover:text-slate-600">Termos</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};