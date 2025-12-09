import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  CheckCircle, 
  AlertOctagon, 
  ScanBarcode, 
  FileText, 
  Filter, 
  Trash2, 
  Info,
  X,
  PackageCheck,
  Search,
  TrendingDown,
  TrendingUp,
  MapPin,
  BellRing,
  ArrowRight,
  ShoppingCart,
  Zap,
  BarChart3
} from 'lucide-react';
import { MOCK_PRODUCTS, STATUS_DEFINITIONS } from '../constants';
import { FilterType, ProductStatus, Product, SmartAlert } from '../types';
import { Toast } from '../components/Toast';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('lote-certo-products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Estados derivados (KPIs e Alertas)
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [totalValueAtRisk, setTotalValueAtRisk] = useState(0);

  // Estados para Inteligência de Compras
  const [urgentBuyList, setUrgentBuyList] = useState<Product[]>([]);
  const [smartBuyList, setSmartBuyList] = useState<Product[]>([]);
  const [topMovers, setTopMovers] = useState<Product[]>([]);

  // Engine de Inteligência: Gera alertas e calcula KPIs
  useEffect(() => {
    const alerts: SmartAlert[] = [];
    let riskValue = 0;
    
    // Arrays auxiliares para o dashboard de compras
    const urgent: Product[] = [];
    const smart: Product[] = [];
    const movers: Product[] = [...products];

    products.forEach(p => {
      // 1. Calcula valor em risco (Perda por validade)
      if (p.status === 'critical' || p.status === 'warning') {
        riskValue += (p.quantity || 0) * (p.unitPrice || 0);
      }

      // 2. Alertas de Validade (Lógica existente)
      if (p.daysRemaining < 90 && (p.quantity || 0) > 50) {
        alerts.push({
          id: `alert-${p.id}`,
          type: 'critical',
          title: 'Alto Risco de Perda',
          message: `${p.name} tem ${p.quantity}un vencendo em ${p.daysRemaining} dias. Sugestão: Ação promocional imediata.`,
          relatedProductId: p.id
        });
      }
      if (p.daysRemaining < 15 && p.status === 'critical') {
        alerts.push({
          id: `crit-${p.id}`,
          type: 'critical',
          title: 'Retirada Imediata',
          message: `${p.name} vence em menos de 15 dias. Retirar da gôndola ${p.location?.aisle || '?'} agora.`,
          relatedProductId: p.id
        });
      }

      // 3. Lógica de COMPRAS
      const avgSales = p.averageDailySales || 0;
      const minStock = p.minStockLevel || 0;
      const currentStock = p.quantity || 0;

      // Risco de Ruptura (Compra Urgente)
      // Se estoque atual <= mínimo OU cobertura < 5 dias (se tiver venda)
      const coverageDays = avgSales > 0 ? currentStock / avgSales : 999;
      
      if (currentStock <= minStock || coverageDays < 5) {
        // Só sugerimos compra urgente se o produto NÃO estiver vencendo (senão é prejuízo duplo)
        if (p.status === 'safe') {
          urgent.push(p);
        }
      } 
      // Compra Inteligente (Oportunidade)
      // Estoque saudável, mas próximo do ponto de pedido (ex: cobertura entre 5 e 15 dias)
      else if (coverageDays >= 5 && coverageDays <= 20 && p.status === 'safe') {
        smart.push(p);
      }

    });

    // Ordenar Mais Vendidos (Top Movers)
    movers.sort((a, b) => (b.averageDailySales || 0) - (a.averageDailySales || 0));

    setSmartAlerts(alerts);
    setTotalValueAtRisk(riskValue);
    setUrgentBuyList(urgent);
    setSmartBuyList(smart);
    setTopMovers(movers.slice(0, 5)); // Top 5
  }, [products]);

  const filteredProducts = products.filter(p => {
    const matchesStatus = filter === 'all' || p.status === filter;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(term) || 
      p.lot.toLowerCase().includes(term) ||
      (p.location?.aisle?.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  const counts = {
    critical: products.filter(p => p.status === 'critical').length,
    warning: products.filter(p => p.status === 'warning').length,
    safe: products.filter(p => p.status === 'safe').length,
  };

  const handleCardClick = (status: ProductStatus) => {
    setFilter(filter === status ? 'all' : status);
  };

  const handleDeleteClick = (id: string) => setProductToDelete(id);

  const confirmDelete = () => {
    if (productToDelete) {
      const updatedProducts = products.filter(p => p.id !== productToDelete);
      setProducts(updatedProducts);
      localStorage.setItem('lote-certo-products', JSON.stringify(updatedProducts));
      setProductToDelete(null);
      setToastMessage("Produto excluído do controle!");
      setShowToast(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-2.5 rounded-xl shadow-lg shadow-slate-900/20 ring-1 ring-slate-950/5">
              <PackageCheck className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                LOTE<span className="font-light text-slate-500 ml-1">CERTO</span>
              </h1>
              <div className="flex items-center mt-1 space-x-1">
                <div className="h-0.5 w-5 bg-blue-600 rounded-full"></div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">
                  Inteligência
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/scanner')}
            className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg hover:bg-slate-800 transition-all shadow-md active:scale-95 border border-slate-700"
          >
            <ScanBarcode className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Auditar Lote</span>
            <span className="sm:hidden font-medium">Auditar</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        
        {/* SEÇÃO 1: MONITORAMENTO DE PERDAS (D-90) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-slate-500" />
              Gestão de Validades
            </h2>
            <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">
              Risco: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValueAtRisk)}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Críticos */}
             <div onClick={() => handleCardClick('critical')} className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${filter === 'critical' ? 'border-red-500 bg-red-50' : 'border-slate-100 bg-white hover:border-red-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertOctagon className="w-5 h-5"/></div>
                  <span className="text-2xl font-bold text-slate-800">{counts.critical}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-600">Críticos (≤ 30 dias)</p>
             </div>
             {/* Atenção */}
             <div onClick={() => handleCardClick('warning')} className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${filter === 'warning' ? 'border-yellow-500 bg-yellow-50' : 'border-slate-100 bg-white hover:border-yellow-200'}`}>
                <div className="flex justify-between items-start">
                   <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600"><AlertTriangle className="w-5 h-5"/></div>
                  <span className="text-2xl font-bold text-slate-800">{counts.warning}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-600">Atenção (31-90 dias)</p>
             </div>
             {/* Seguros */}
             <div onClick={() => handleCardClick('safe')} className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${filter === 'safe' ? 'border-green-500 bg-green-50' : 'border-slate-100 bg-white hover:border-green-200'}`}>
                <div className="flex justify-between items-start">
                   <div className="p-2 bg-green-100 rounded-lg text-green-600"><CheckCircle className="w-5 h-5"/></div>
                  <span className="text-2xl font-bold text-slate-800">{counts.safe}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-600">Seguros (&gt; 90 dias)</p>
             </div>
          </div>
        </section>

        {/* SEÇÃO 2: INTELIGÊNCIA DE ABASTECIMENTO (NOVO) */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
           <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2 text-blue-500" />
              Inteligência de Compras
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* CARD 1: MAIS VENDIDOS (GIRO) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col h-full">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Mais Vendidos</h3>
                    <p className="text-[10px] text-slate-500">Curva A de Giro</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  {topMovers.length > 0 ? topMovers.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                      <div className="flex items-center">
                        <span className="w-5 h-5 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-xs font-bold mr-2">{i+1}</span>
                        <span className="truncate w-32 font-medium text-slate-700">{p.name}</span>
                      </div>
                      <span className="font-bold text-blue-600">{p.averageDailySales} un/dia</span>
                    </div>
                  )) : <p className="text-xs text-slate-400 italic">Sem dados de venda.</p>}
                </div>
              </div>

              {/* CARD 2: COMPRA URGENTE (RUPTURA) */}
              <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5 flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -mr-2 -mt-2"></div>
                <div className="flex items-center mb-4 relative z-10">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg mr-3">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Risco de Ruptura</h3>
                    <p className="text-[10px] text-red-500 font-semibold">Repor com Urgência</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3 relative z-10">
                  {urgentBuyList.length > 0 ? urgentBuyList.map(p => (
                    <div key={p.id} className="bg-red-50 p-2 rounded-lg border border-red-100">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-slate-800 line-clamp-1">{p.name}</span>
                        <span className="bg-white text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-100">
                          {p.quantity} un
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                         <span>Mínimo: {p.minStockLevel}</span>
                         <span>Cobertura: <b className="text-red-600">{((p.quantity || 0) / (p.averageDailySales || 1)).toFixed(1)} dias</b></span>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <CheckCircle className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs">Estoque seguro</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 3: COMPRA INTELIGENTE (OPORTUNIDADE) */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-5 flex flex-col h-full text-white">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-white/10 text-yellow-400 rounded-lg mr-3 border border-white/10">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Compra Inteligente</h3>
                    <p className="text-[10px] text-slate-400">Otimizar Abastecimento</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                   {smartBuyList.length > 0 ? smartBuyList.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-sm bg-white/5 p-2 rounded-lg border border-white/5">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200 line-clamp-1 w-32">{p.name}</span>
                        <span className="text-[10px] text-slate-400">Giro: {p.averageDailySales} un/dia</span>
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold transition-colors">
                        Repor
                      </button>
                    </div>
                   )) : (
                     <p className="text-xs text-slate-500 italic text-center mt-4">Nenhuma sugestão no momento.</p>
                   )}
                </div>
                <div className="mt-auto pt-3 border-t border-white/10">
                   <p className="text-[10px] text-slate-400 text-center">
                     Sugestões baseadas em giro e cobertura ideal (15-20 dias).
                   </p>
                </div>
              </div>

            </div>
        </section>

        {/* LISTA COMPLETA (Busca) */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
           {/* Filtros e Busca */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                  placeholder="Buscar produto, lote ou local..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 w-full md:w-auto">
                {filter !== 'all' && (
                  <button onClick={() => setFilter('all')} className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors">
                    Limpar Filtros
                  </button>
                )}
                <button onClick={() => {setShowToast(true); setToastMessage("Relatório de Perdas (PDF) Gerado!");}} className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" /> Relatório D-90
                </button>
              </div>
            </div>

            {/* Alertas Inteligentes (Painel de Gestão) */}
            {smartAlerts.length > 0 && (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 animate-fade-in">
                <div className="flex items-center mb-3">
                  <BellRing className="w-4 h-4 text-orange-500 mr-2" />
                  <h3 className="text-orange-800 font-bold text-xs uppercase tracking-wide">Avisos do Sistema</h3>
                </div>
                <div className="grid gap-2">
                  {smartAlerts.map(alert => (
                    <div key={alert.id} className="bg-white border border-orange-200 p-3 rounded-lg flex items-start space-x-3 shadow-sm">
                      <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${alert.type === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                      <div className="flex-1">
                        <h4 className="text-slate-800 font-semibold text-xs">{alert.title}</h4>
                        <p className="text-slate-500 text-[10px] mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabela Principal */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Produto</th>
                      <th className="px-6 py-3 font-semibold text-center">Giro (Dia)</th>
                      <th className="px-6 py-3 font-semibold text-center">Estoque</th>
                      <th className="px-6 py-3 font-semibold">Lote/Validade</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((product) => {
                      const statusConfig = STATUS_DEFINITIONS[product.status];
                      return (
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{product.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200 flex items-center">
                                 <MapPin className="w-3 h-3 mr-1" /> {product.location?.aisle || 'N/A'}
                               </div>
                               <div className="text-[10px] text-slate-400">R$ {product.unitPrice?.toFixed(2)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             {product.averageDailySales ? (
                               <div className="flex flex-col items-center">
                                 <span className="font-bold text-blue-600 text-xs">{product.averageDailySales} un</span>
                                 <span className="text-[10px] text-slate-400">média/dia</span>
                               </div>
                             ) : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`font-bold ${product.quantity <= (product.minStockLevel || 0) ? 'text-red-600' : 'text-slate-700'}`}>
                              {product.quantity || 0}
                            </span>
                            <span className="text-xs text-slate-400 ml-1">un</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-mono text-slate-500">L: {product.lot}</div>
                            <div className={`text-xs font-bold ${product.daysRemaining <= 30 ? 'text-red-600' : 'text-slate-700'}`}>
                              {product.expiryDate}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusConfig.badge}`}>
                              {statusConfig.label.split(' ')[0]}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteClick(product.id)}
                              className="text-slate-300 hover:text-red-500 p-2 rounded-full transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
        </section>
      </main>

      {/* Modal Delete */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmar Baixa?</h3>
            <p className="text-slate-500 text-sm mb-6">Isso removerá o produto do controle de estoque e auditoria.</p>
            <div className="flex gap-3">
              <button onClick={() => setProductToDelete(null)} className="flex-1 py-2.5 border rounded-xl text-sm font-semibold text-slate-600">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/30">Confirmar Baixa</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
};