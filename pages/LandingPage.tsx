import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Flask, 
  Pulse, 
  CaretRight, 
  Scan,
  ArrowRight
} from '@phosphor-icons/react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleAccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-medical-dark">
      
      {/* HEADER PREMIUM */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-medical-gray">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-medical-primary/10 p-2 rounded-lg">
              <ShieldCheck weight="duotone" className="w-6 h-6 text-medical-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-medical-dark leading-none">
                LOTE CERTO
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-medical-primary font-semibold">
                Gestão Inteligente de Validades
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-500">
            <a href="#solucao" className="hover:text-medical-primary transition-colors">Solução Clínica</a>
            <a href="#seguranca" className="hover:text-medical-primary transition-colors">Segurança</a>
            <a href="#contato" className="hover:text-medical-primary transition-colors">Suporte</a>
          </div>

          <button 
            onClick={handleAccess}
            className="bg-medical-dark text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-700 transition-all shadow-lg shadow-medical-dark/10 active:scale-95 flex items-center gap-2 group"
          >
            Acessar Sistema <ArrowRight weight="bold" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      {/* HERO SECTION CLEAN */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-medical-primary text-xs font-bold uppercase tracking-wide mb-8 border border-teal-100 shadow-sm">
            <Pulse weight="bold" className="w-3.5 h-3.5" /> Tecnologia Farmacêutica 2.0
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-medical-dark tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
            Controle clínico e seguro <br/>
            dos seus <span className="text-medical-primary">lotes farmacêuticos.</span>
          </h1>
          
          <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-500 mb-10 leading-relaxed font-light">
            Confiança, precisão e rastreabilidade para hospitais e farmácias. 
            Auditoria automatizada via IA para garantir conformidade total com a ANVISA.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={handleAccess}
              className="px-8 py-4 bg-medical-primary text-white rounded-xl font-semibold text-lg hover:bg-teal-500 transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 group"
            >
              Iniciar Controle Agora
              <CaretRight weight="bold" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* DASHBOARD PREVIEW ABSTRACT */}
          <div className="mt-20 relative max-w-5xl mx-auto">
             <div className="absolute inset-0 bg-gradient-to-r from-teal-200 to-blue-200 rounded-3xl blur-3xl opacity-20 -z-10"></div>
             <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-1 grid grid-cols-3 gap-1">
                {/* Visual Representation of Features */}
                <div className="bg-slate-50 p-8 rounded-xl flex flex-col items-center border border-slate-100 hover:bg-white transition-colors cursor-default group">
                   <div className="p-3 bg-teal-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                     <Scan weight="duotone" className="w-10 h-10 text-medical-primary" />
                   </div>
                   <h3 className="font-semibold text-medical-dark">Leitura Óptica (OCR)</h3>
                   <p className="text-sm text-slate-400 mt-2">Identificação de lote e validade</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-xl flex flex-col items-center border border-slate-100 hover:bg-white transition-colors cursor-default group">
                   <div className="p-3 bg-blue-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <ShieldCheck weight="duotone" className="w-10 h-10 text-blue-900" />
                   </div>
                   <h3 className="font-semibold text-medical-dark">Compliance</h3>
                   <p className="text-sm text-slate-400 mt-2">Segurança normativa D-90</p>
                </div>
                <div className="bg-slate-50 p-8 rounded-xl flex flex-col items-center border border-slate-100 hover:bg-white transition-colors cursor-default group">
                   <div className="p-3 bg-teal-50 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Flask weight="duotone" className="w-10 h-10 text-teal-600" />
                   </div>
                   <h3 className="font-semibold text-medical-dark">Gestão de Estoque</h3>
                   <p className="text-sm text-slate-400 mt-2">Predição de compras</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* FOOTER SIMPLE */}
      <footer className="bg-white border-t border-slate-100 py-12">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
               <ShieldCheck weight="fill" className="w-5 h-5 text-medical-primary" />
               <span className="font-bold text-medical-dark">LOTE CERTO</span>
            </div>
            <p className="text-slate-400 text-sm">
               &copy; 2024 Lote Certo. Desenvolvido para o setor de saúde.
            </p>
         </div>
      </footer>
    </div>
  );
};