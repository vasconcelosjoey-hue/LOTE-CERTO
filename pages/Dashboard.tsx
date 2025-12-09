import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Warning, 
  CheckCircle, 
  WarningOctagon, 
  Scan, 
  FileText, 
  Trash, 
  MagnifyingGlass,
  TrendUp,
  MapPin,
  Bell,
  Pulse,
  FirstAidKit,
  ArrowRight,
  ShieldCheck,
  Spinner
} from '@phosphor-icons/react';
import { STATUS_DEFINITIONS } from '../constants';
import { FilterType, ProductStatus, Product, SmartAlert } from '../types';
import { Toast } from '../components/Toast';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Estados derivados
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [totalValueAtRisk, setTotalValueAtRisk] = useState(0);
  const [urgentBuyList, setUrgentBuyList] = useState<Product[]>([]);
  const [smartBuyList, setSmartBuyList] = useState<Product[]>([]);
  const [topMovers, setTopMovers] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const querySnapshot = await getDocs(collection(db, "products"));
        const firebaseProducts = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id 
        })) as Product[];
        setProducts(firebaseProducts);
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        setToastMessage("Erro ao conectar com o banco de dados.");
        setShowToast(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const alerts: SmartAlert[] = [];
    let riskValue = 0;
    const urgent: Product[] = [];
    const smart: Product[] = [];
    const movers: Product[] = [...products];

    products.forEach(p => {
      if (p.status === 'critical' || p.status === 'warning') {
        riskValue += (p.quantity || 0) * (p.unitPrice || 0);
      }
      if (p.daysRemaining < 90 && (p.quantity || 0) > 50) {
        alerts.push({
          id: `alert-${p.id}`,
          type: 'critical',
          title: 'Alto Risco de Perda',
          message: `${p.name} tem ${p.quantity}un vencendo em ${p.daysRemaining} dias.`,
          relatedProductId: p.id
        });
      }
      if (p.daysRemaining < 15 && p.status === 'critical') {
        alerts.push({
          id: `crit-${p.id}`,
          type: 'critical',
          title: 'Retirada Imediata',
          message: `${p.name} vence em menos de 15 dias.`,
          relatedProductId: p.id
        });
      }

      const avgSales = p.averageDailySales || 0;
      const minStock = p.minStockLevel || 0;
      const currentStock = p.quantity || 0;
      const coverageDays = avgSales > 0 ? currentStock / avgSales : 999;
      
      if (currentStock <= minStock || coverageDays < 5) {
        if (p.status === 'safe') urgent.push(p);
      } else if (coverageDays >= 5 && coverageDays <= 20 && p.status === 'safe') {
        smart.push(p);
      }
    });

    movers.sort((a, b) => (b.averageDailySales || 0) - (a.averageDailySales || 0));

    setSmartAlerts(alerts);
    setTotalValueAtRisk(riskValue);
    setUrgentBuyList(urgent);
    setSmartBuyList(smart);
    setTopMovers(movers.slice(0, 5));
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

  const handleDeleteClick = (id: string) => setProductToDelete(id);

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteDoc(doc(db, "products", productToDelete));
        setProducts(prev => prev.filter(p => p.id !== productToDelete));
        setProductToDelete(null);
        setToastMessage("Produto removido com sucesso.");
        setShowToast(true);
      } catch (error) {
        console.error("Erro ao deletar:", error);
        setToastMessage("Erro ao excluir.");
        setShowToast(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-medical-gray/50 pb-20 font-sans text-medical-dark">
      
      {/* NAVBAR SUPERIOR */}
      <header className="bg-white sticky top-0 z-20 border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-18 flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
             <div className="bg-medical-primary rounded-lg p-1.5 text-white">
                <ShieldCheck weight="duotone" className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-lg font-bold text-medical-dark leading-none tracking-tight">LOTE CERTO</h1>
                <p className="text-[10px] text-slate-500 font-medium">Gestão Inteligente</p>
             </div>
          </div>

          <button 
            onClick={() => navigate('/scanner')}
            className="group flex items-center gap-2 bg-medical-primary text-white px-5 py-2.5 rounded-lg hover:bg-teal-600 transition-all shadow-md active:scale-95"
          >
            <Scan weight="bold" className="w-4 h-4" />
            <span className="font-semibold text-sm">Iniciar Leitura de Lote</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {isLoading ? (
           <div className="flex flex-col items-center justify-center py-20">
             <Spinner weight="bold" className="w-10 h-10 text-medical-primary animate-spin mb-4" />
             <p className="text-slate-400 font-medium">Carregando dados clínicos...</p>
           </div>
        ) : (
          <>
            {/* KPI CARDS - ELEGANT */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="md:col-span-1 bg-white p-6 rounded-xl border border-slate-100 shadow-soft flex flex-col justify-between">
                  <div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Valor em Risco</h3>
                    <div className="text-2xl font-bold text-medical-danger">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValueAtRisk)}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-xs text-medical-danger font-medium bg-red-50 w-fit px-2 py-1 rounded">
                     <TrendUp weight="bold" className="w-3 h-3 mr-1" /> Ação Imediata
                  </div>
               </div>

               {/* STATUS CARDS */}
               {[
                 { id: 'critical', label: 'Críticos (≤ 30 dias)', count: counts.critical, color: 'text-medical-danger', bg: 'bg-red-50', border: 'border-red-100', icon: WarningOctagon },
                 { id: 'warning', label: 'Atenção (31-90 dias)', count: counts.warning, color: 'text-medical-warning', bg: 'bg-yellow-50', border: 'border-yellow-100', icon: Warning },
                 { id: 'safe', label: 'Seguros (> 90 dias)', count: counts.safe, color: 'text-medical-success', bg: 'bg-green-50', border: 'border-green-100', icon: CheckCircle },
               ].map((card) => (
                 <div 
                    key={card.id}
                    onClick={() => setFilter(filter === card.id ? 'all' : card.id as ProductStatus)}
                    className={`cursor-pointer bg-white p-6 rounded-xl border shadow-soft transition-all hover:-translate-y-1 relative overflow-hidden ${filter === card.id ? 'ring-2 ring-medical-primary' : 'border-slate-100'}`}
                 >
                    <div className={`absolute top-0 right-0 p-3 rounded-bl-xl ${card.bg}`}>
                       <card.icon weight="duotone" className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <div className="text-3xl font-bold text-medical-dark mt-2">{card.count}</div>
                    <p className="text-sm text-slate-500 font-medium mt-1">{card.label}</p>
                 </div>
               ))}
            </div>

            {/* INTELLIGENCE SECTION - CLINICAL LOOK */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* URGENT REFILL */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
                   <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Pulse weight="duotone" className="w-5 h-5 text-medical-primary" />
                         <h3 className="font-bold text-medical-dark text-sm">Risco de Ruptura</h3>
                      </div>
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">Urgente</span>
                   </div>
                   <div className="p-4 space-y-3">
                      {urgentBuyList.length > 0 ? urgentBuyList.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm p-3 bg-red-50/50 rounded-lg border border-red-100/50">
                           <div className="flex flex-col">
                              <span className="font-semibold text-medical-dark">{p.name}</span>
                              <span className="text-xs text-red-600 font-medium">Estoque: {p.quantity} (Min: {p.minStockLevel})</span>
                           </div>
                           <button className="text-xs bg-white border border-red-200 text-red-700 px-3 py-1 rounded font-bold hover:bg-red-50">Repor</button>
                        </div>
                      )) : (
                        <div className="text-center py-6 text-slate-400 text-sm">Nenhuma ruptura prevista.</div>
                      )}
                   </div>
                </div>

                {/* SMART BUY */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
                   <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <FirstAidKit weight="duotone" className="w-5 h-5 text-medical-dark" />
                         <h3 className="font-bold text-medical-dark text-sm">Sugestão de Compra</h3>
                      </div>
                   </div>
                   <div className="p-4 space-y-3">
                      {smartBuyList.length > 0 ? smartBuyList.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                           <div>
                              <span className="font-semibold text-medical-dark block">{p.name}</span>
                              <span className="text-xs text-slate-500">Giro: {p.averageDailySales} un/dia</span>
                           </div>
                           <ArrowRight weight="bold" className="w-4 h-4 text-slate-300" />
                        </div>
                      )) : (
                        <div className="text-center py-6 text-slate-400 text-sm">Estoque otimizado.</div>
                      )}
                   </div>
                </div>

                {/* ALERTS PANEL */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden flex flex-col">
                   <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                      <Bell weight="duotone" className="w-5 h-5 text-medical-warning" />
                      <h3 className="font-bold text-medical-dark text-sm">Alertas Clínicos</h3>
                   </div>
                   <div className="p-4 space-y-2 flex-1 overflow-y-auto max-h-[300px]">
                      {smartAlerts.length > 0 ? smartAlerts.map(alert => (
                         <div key={alert.id} className="flex gap-3 items-start p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.type === 'critical' ? 'bg-medical-danger' : 'bg-medical-warning'}`}></div>
                            <div>
                               <h4 className="text-xs font-bold text-medical-dark">{alert.title}</h4>
                               <p className="text-xs text-slate-500 mt-1 leading-relaxed">{alert.message}</p>
                            </div>
                         </div>
                      )) : (
                        <div className="text-center py-6 text-slate-400 text-sm">Sistema sem alertas.</div>
                      )}
                   </div>
                </div>
            </section>

            {/* MAIN DATA TABLE */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-soft overflow-hidden">
               <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-white">
                  <div className="relative w-full md:w-96">
                     <MagnifyingGlass weight="bold" className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                     <input 
                       type="text" 
                       placeholder="Buscar por nome, lote ou princípio ativo..." 
                       className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-medical-dark focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all"
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                  <div className="flex gap-3">
                     {filter !== 'all' && (
                        <button onClick={() => setFilter('all')} className="text-xs font-bold text-slate-500 hover:text-medical-dark bg-slate-100 px-3 py-2 rounded-lg transition-colors">
                           Limpar Filtros
                        </button>
                     )}
                     <button 
                       onClick={() => { setShowToast(true); setToastMessage("PDF D-90 Gerado com sucesso."); }}
                       className="flex items-center gap-2 bg-white border border-slate-200 text-medical-dark px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                     >
                        <FileText weight="duotone" className="w-4 h-4 text-slate-400" />
                        Relatório D-90
                     </button>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                     <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-200">
                        <tr>
                           <th className="px-6 py-4">Produto</th>
                           <th className="px-6 py-4 text-center">Giro Diário</th>
                           <th className="px-6 py-4 text-center">Estoque</th>
                           <th className="px-6 py-4">Lote / Validade</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {filteredProducts.length > 0 ? filteredProducts.map((product) => {
                           const statusConfig = STATUS_DEFINITIONS[product.status] || STATUS_DEFINITIONS['safe'];
                           // Mapping prompt colors
                           let badgeClass = "bg-green-100 text-green-800";
                           if (product.status === 'critical') badgeClass = "bg-red-100 text-red-800";
                           if (product.status === 'warning') badgeClass = "bg-yellow-100 text-yellow-800";

                           return (
                              <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                                 <td className="px-6 py-4">
                                    <div className="font-semibold text-medical-dark">{product.name}</div>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                       <span className="flex items-center"><MapPin weight="bold" className="w-3 h-3 mr-1" /> {product.location?.aisle || '-'}</span>
                                       <span>•</span>
                                       <span>R$ {product.unitPrice?.toFixed(2)}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 text-center text-slate-600 font-medium">
                                    {product.averageDailySales || '-'}
                                 </td>
                                 <td className="px-6 py-4 text-center font-bold text-medical-dark">
                                    {product.quantity}
                                 </td>
                                 <td className="px-6 py-4">
                                    <div className="text-xs font-mono text-slate-500 mb-0.5">L: {product.lot}</div>
                                    <div className={`text-xs font-bold ${product.daysRemaining <= 30 ? 'text-medical-danger' : 'text-medical-dark'}`}>
                                       {product.expiryDate}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border border-transparent ${badgeClass}`}>
                                       {statusConfig.label.split(' ')[0]}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => handleDeleteClick(product.id)}
                                      className="p-2 text-slate-300 hover:text-medical-danger hover:bg-red-50 rounded-lg transition-all"
                                    >
                                       <Trash weight="duotone" className="w-4 h-4" />
                                    </button>
                                 </td>
                              </tr>
                           );
                        }) : (
                           <tr>
                              <td colSpan={6} className="text-center py-12 text-slate-400">
                                 Nenhum registro encontrado.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </section>

          </>
        )}
      </main>

      {/* MODAL DELETE */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-medical-dark/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-medical-dark mb-2">Confirmar Baixa?</h3>
            <p className="text-slate-500 text-sm mb-6">Esta ação removerá o produto do controle clínico.</p>
            <div className="flex gap-3">
              <button onClick={() => setProductToDelete(null)} className="flex-1 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 bg-medical-danger text-white rounded-lg text-sm font-bold shadow-lg shadow-red-500/20 hover:bg-red-600">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
};