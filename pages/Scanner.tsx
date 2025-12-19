import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { 
  CaretLeft, 
  Camera, 
  CheckCircle, 
  ArrowsClockwise, 
  Scan,
  X,
  Trash,
  Package,
  CurrencyDollar,
  Plus,
  ArrowRight,
  MapPin,
  Spinner,
  Images
} from '@phosphor-icons/react';
import { Toast } from '../components/Toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

type ScannerStep = 'idle' | 'camera' | 'gallery' | 'processing' | 'result';

interface ScannedData {
  name: string;
  manufacturerLot: string;
  internalId: string;
  manufactureDate: string;
  expiryDate: string;
  barcode: string;
  codeType: string;
  price: string;
  quantity: string; 
  aisle: string;    
  shelf: string;    
  confidence: number;
  status: 'warning' | 'safe' | 'critical';
  daysRemaining: number;
  images: string[];
}

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<ScannerStep>('idle');
  const [showToast, setShowToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      setStream(mediaStream);
      setStep('camera');
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (step === 'camera' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [step, stream]);

  useEffect(() => { return () => stopCamera(); }, []);

  const generateInternalId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  // Helper to handle dates like MM/YYYY to last day of month
  const parseDate = (dateString: string) => {
    if (!dateString) return null;
    const parts = dateString.split('/');
    
    if (parts.length === 2) {
      // MM/YYYY format
      const month = parseInt(parts[0]);
      const year = parseInt(parts[1]);
      // Last day of month
      return new Date(year, month, 0);
    } else if (parts.length === 3) {
      // DD/MM/YYYY format
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      return new Date(year, month - 1, day);
    }
    return null;
  };

  const calculateStatusAndDays = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = parseDate(dateString);
    if (!expiry || isNaN(expiry.getTime())) {
      return { status: 'safe' as const, diffDays: 0 };
    }

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    if (diffDays <= 30) status = 'critical';
    else if (diffDays <= 90) status = 'warning';
    
    return { status, diffDays };
  };

  const captureFrame = (): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  };

  const handleCapture = () => {
    const img = captureFrame();
    if (img) {
      setCapturedImages(prev => [...prev, img]);
      stopCamera();
      setStep('gallery');
    }
  };

  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleProcessImages = async () => {
    if (capturedImages.length === 0) return;
    setStep('processing');
    await processWithAI(capturedImages);
  };

  const processWithAI = async (images: string[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [
        { text: `Você é um especialista em logística farmacêutica. Analise as imagens (rótulo, lote, código de barras) e extraia os dados técnicos. 
          Hoje é ${new Date().toLocaleDateString('pt-BR')}.
          
          REGRAS DE OCR:
          - Identifique o NOME COMERCIAL e a DOSAGEM (ex: Amoxicilina 500mg).
          - Identifique o LOTE (L, Lot, Batch).
          - Identifique VALIDADE (Val, Exp, Venc). Se estiver MM/AAAA, considere o último dia do mês.
          - Identifique CÓDIGO DE BARRAS (EAN-13 ou Datamatrix).
          - Identifique PREÇO (R$).
          
          Retorne APENAS um JSON:
          {
            "name": "Nome Completo",
            "lot": "LOTE123",
            "expiryDate": "DD/MM/YYYY",
            "manufactureDate": "DD/MM/YYYY",
            "barcode": "0000000000000",
            "codeType": "EAN-13",
            "price": "0.00",
            "confidence": 95
          }` 
        }
      ];
      
      images.forEach((img) => {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: parts },
        config: { responseMimeType: 'application/json' }
      });

      const resultText = response.text || "{}";
      const data = JSON.parse(resultText);
      const { status, diffDays } = calculateStatusAndDays(data.expiryDate || "");
      const newInternalId = generateInternalId();

      setScannedData({
        name: data.name || "Produto Desconhecido",
        manufacturerLot: data.lot || "",
        internalId: newInternalId,
        manufactureDate: data.manufactureDate || "",
        expiryDate: data.expiryDate || "",
        barcode: data.barcode || "",
        codeType: data.codeType || "Automático",
        price: data.price ? data.price.replace(/[^\d.,]/g, '').replace(',', '.') : "",
        quantity: "1",
        aisle: "",
        shelf: "",
        confidence: data.confidence || 0,
        status: status,
        daysRemaining: diffDays,
        images: images
      });
      setStep('result');
    } catch (error) {
      console.error("Erro no OCR:", error);
      setScannedData({
        name: 'Manual - Ajuste os dados',
        manufacturerLot: '',
        internalId: generateInternalId(),
        manufactureDate: '',
        expiryDate: '',
        barcode: '',
        codeType: 'Manual',
        price: '',
        quantity: '1',
        aisle: '',
        shelf: '',
        confidence: 0,
        status: 'safe',
        daysRemaining: 0,
        images: images
      });
      setStep('result');
    }
  };

  const handleDataChange = (field: keyof ScannedData, value: string) => {
    if (!scannedData) return;
    if (field === 'expiryDate') {
      const { status, diffDays } = calculateStatusAndDays(value);
      setScannedData({ ...scannedData, expiryDate: value, status, daysRemaining: diffDays });
    } else {
      setScannedData({ ...scannedData, [field]: value });
    }
  };

  // Define handleRescan to reset the scanner state and return to initial step
  const handleRescan = () => {
    setScannedData(null);
    setCapturedImages([]);
    setStep('idle');
  };

  const handleConfirm = async () => {
    if (scannedData) {
      setIsSaving(true);
      try {
        const newProduct = {
          name: scannedData.name,
          lot: scannedData.manufacturerLot,
          expiryDate: scannedData.expiryDate,
          daysRemaining: scannedData.daysRemaining,
          status: scannedData.status,
          manufactureDate: scannedData.manufactureDate,
          quantity: parseInt(scannedData.quantity) || 0,
          unitPrice: parseFloat(scannedData.price) || 0,
          location: { aisle: scannedData.aisle.toUpperCase(), shelf: scannedData.shelf.toUpperCase() },
          images: scannedData.images,
          codeType: scannedData.codeType,
          averageDailySales: 0,
          minStockLevel: 10
        };
        await addDoc(collection(db, "products"), newProduct);
        setShowToast(true);
        setTimeout(() => { navigate('/dashboard'); }, 1500);
      } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar produto. Tente novamente.");
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-medical-dark flex flex-col font-sans">
      <canvas ref={canvasRef} className="hidden" />

      {/* HEADER SCANNER */}
      <div className="px-4 py-4 flex items-center bg-medical-dark/95 backdrop-blur-sm fixed w-full top-0 z-30 text-white border-b border-white/10">
        <button onClick={() => navigate('/dashboard')} className="mr-3 p-1 hover:bg-white/10 rounded-full transition-colors">
          <CaretLeft weight="bold" className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Scan weight="duotone" className="w-5 h-5 text-medical-primary" />
          <h1 className="text-sm font-bold tracking-tight uppercase">Scanner de Lotes</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 mt-16 pb-24 w-full">
        
        {/* IDLE STATE */}
        {step === 'idle' && (
          <div className="w-full max-w-sm flex flex-col items-center animate-fade-in space-y-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-medical-primary/20 rounded-full blur-xl group-hover:bg-medical-primary/30 transition-all"></div>
              <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-full flex items-center justify-center relative">
                 <Camera weight="duotone" className="w-12 h-12 text-medical-primary" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Pronto para escanear</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                Capture fotos do rótulo, lote e código de barras para análise automática.
              </p>
            </div>

            <button
              onClick={startCamera}
              className="w-full bg-medical-primary hover:bg-teal-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-teal-500/20 transition-all active:scale-95"
            >
              <Camera weight="fill" className="w-6 h-6" />
              <span>ABRIR CÂMERA CLÍNICA</span>
            </button>
            
            <div className="grid grid-cols-2 gap-4 w-full opacity-40">
               <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <Scan weight="bold" className="w-4 h-4 text-white mx-auto mb-1" />
                  <span className="text-[10px] text-white block">EAN-13</span>
               </div>
               <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <Images weight="bold" className="w-4 h-4 text-white mx-auto mb-1" />
                  <span className="text-[10px] text-white block">Datamatrix</span>
               </div>
            </div>
          </div>
        )}

        {/* CAMERA VIEW */}
        {step === 'camera' && (
          <div className="w-full h-full fixed inset-0 z-20 bg-black flex flex-col">
             <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
             
             {/* SCANNER OVERLAY */}
             <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-[85%] aspect-square border-2 border-white/20 rounded-3xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]">
                   <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-medical-primary rounded-tl-3xl -mt-1 -ml-1"></div>
                   <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-medical-primary rounded-tr-3xl -mt-1 -mr-1"></div>
                   <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-medical-primary rounded-bl-3xl -mb-1 -ml-1"></div>
                   <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-medical-primary rounded-br-3xl -mb-1 -mr-1"></div>
                   
                   <div className="absolute inset-x-0 -top-12 text-center">
                      <span className="text-white text-xs font-bold uppercase tracking-widest bg-medical-primary px-4 py-1.5 rounded-full">
                        Capturando Foto {capturedImages.length + 1}
                      </span>
                   </div>
                </div>
             </div>

             <div className="absolute bottom-12 inset-x-0 flex flex-col items-center z-40 gap-6">
                <p className="text-white/60 text-xs font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                   Enquadre o rótulo ou o código de barras
                </p>
                <div className="flex items-center gap-8">
                  <button onClick={() => { stopCamera(); setStep(capturedImages.length > 0 ? 'gallery' : 'idle'); }} className="p-4 bg-white/10 text-white rounded-full backdrop-blur-md">
                    <X weight="bold" className="w-6 h-6" />
                  </button>
                  <button onClick={handleCapture} className="w-24 h-24 bg-white rounded-full p-2 shadow-2xl active:scale-90 transition-transform">
                    <div className="w-full h-full bg-white rounded-full border-4 border-medical-primary flex items-center justify-center">
                       <div className="w-14 h-14 bg-medical-primary rounded-full"></div>
                    </div>
                  </button>
                  <div className="w-14"></div> {/* Spacer for balance */}
                </div>
             </div>
          </div>
        )}

        {/* GALLERY REVIEW */}
        {step === 'gallery' && (
          <div className="w-full max-w-sm flex flex-col items-center animate-fade-in-up">
             <div className="bg-white rounded-3xl p-6 shadow-2xl w-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-medical-dark">Fotos Capturadas</h3>
                  <span className="text-xs font-bold text-slate-400">{capturedImages.length}/3</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-8">
                   {capturedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 group">
                         <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover" />
                         <button 
                           onClick={() => removeImage(idx)}
                           className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <Trash weight="bold" className="w-3 h-3" />
                         </button>
                      </div>
                   ))}
                   {capturedImages.length < 3 && (
                      <button 
                        onClick={startCamera}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 hover:border-medical-primary transition-all text-slate-400 hover:text-medical-primary"
                      >
                         <Plus weight="bold" className="w-6 h-6" />
                         <span className="text-[10px] font-bold uppercase">Novo Ângulo</span>
                      </button>
                   )}
                </div>

                <div className="space-y-3">
                   <button 
                     onClick={handleProcessImages} 
                     disabled={capturedImages.length === 0}
                     className="w-full py-4 rounded-2xl bg-medical-primary text-white font-bold text-sm shadow-xl shadow-teal-500/10 hover:bg-teal-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                      ANALISAR PRODUTO <ArrowRight weight="bold" className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={() => { setCapturedImages([]); setStep('idle'); }} 
                     className="w-full py-3 text-slate-400 font-semibold text-xs hover:text-medical-danger transition-colors"
                   >
                     Descartar fotos e cancelar
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* PROCESSING */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center animate-pulse">
             <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 border-[6px] border-white/5 rounded-full"></div>
                <div className="absolute inset-0 border-[6px] border-medical-primary border-t-transparent rounded-full animate-spin"></div>
                <Scan weight="duotone" className="w-12 h-12 text-medical-primary" />
             </div>
             <p className="mt-8 text-white font-bold tracking-[0.2em] text-sm text-center">
                IA ESTÁ PROCESSANDO<br/>
                <span className="text-white/40 font-medium tracking-normal text-xs uppercase">Extraindo dados clínicos...</span>
             </p>
          </div>
        )}

        {/* RESULT FORM */}
        {step === 'result' && scannedData && (
          <div className="w-full max-w-md animate-fade-in-up">
             <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-medical-dark text-lg">Revisão de Dados</h3>
                   <span className={`text-[10px] font-bold px-3 py-1 rounded-full tracking-wider border ${
                      scannedData.status === 'critical' ? 'bg-red-50 text-red-700 border-red-100' : 
                      scannedData.status === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                      'bg-green-50 text-green-700 border-green-100'
                   }`}>
                      {scannedData.status === 'critical' ? '⚠️ CRÍTICO' : scannedData.status === 'warning' ? '🕒 ATENÇÃO' : '✅ SEGURO'}
                   </span>
                </div>

                <div className="p-6 space-y-5">
                   {/* INFO SECTION */}
                   <div className="space-y-4">
                      <div className="group">
                         <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Produto / Princípio Ativo</label>
                         <input 
                            type="text" 
                            value={scannedData.name} 
                            onChange={(e) => handleDataChange('name', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-semibold text-medical-dark focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-all" 
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Lote do Fabricante</label>
                            <input 
                               type="text" 
                               value={scannedData.manufacturerLot} 
                               onChange={(e) => handleDataChange('manufacturerLot', e.target.value)}
                               className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-mono font-bold text-medical-dark" 
                            />
                         </div>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Data de Validade</label>
                            <input 
                               type="text" 
                               value={scannedData.expiryDate} 
                               placeholder="DD/MM/YYYY"
                               onChange={(e) => handleDataChange('expiryDate', e.target.value)}
                               className={`w-full border rounded-xl p-3.5 text-sm font-bold outline-none transition-all ${
                                  scannedData.status === 'critical' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-medical-dark'
                               }`} 
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Preço Custo (R$)</label>
                          <div className="relative">
                              <CurrencyDollar weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input type="text" value={scannedData.price} onChange={(e) => handleDataChange('price', e.target.value)} className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-mono text-medical-dark" placeholder="0.00" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 ml-1">Qtd em Estoque</label>
                          <input type="number" value={scannedData.quantity} onChange={(e) => handleDataChange('quantity', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm font-bold text-medical-primary text-center" />
                        </div>
                      </div>

                      {/* LOGISTICS SECTION */}
                      <div className="bg-medical-gray/30 p-4 rounded-2xl border border-medical-gray/50">
                         <p className="text-[10px] font-bold text-medical-dark uppercase tracking-wider mb-3 flex items-center gap-2">
                            <MapPin weight="fill" className="w-3 h-3 text-medical-primary" /> Endereçamento de Estoque
                         </p>
                         <div className="grid grid-cols-2 gap-3">
                            <div>
                               <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase">Corredor</label>
                               <input type="text" value={scannedData.aisle} onChange={(e) => handleDataChange('aisle', e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs" placeholder="A1" />
                            </div>
                            <div>
                               <label className="text-[9px] text-slate-400 font-bold block mb-1 uppercase">Prateleira</label>
                               <input type="text" value={scannedData.shelf} onChange={(e) => handleDataChange('shelf', e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs" placeholder="P2" />
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex gap-3 pt-2">
                      <button onClick={handleRescan} disabled={isSaving} className="flex-1 py-4 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                         <ArrowsClockwise weight="bold" className="w-4 h-4" /> REINICIAR
                      </button>
                      <button onClick={handleConfirm} disabled={isSaving} className="flex-[2] py-4 rounded-2xl bg-medical-primary text-white font-bold text-sm shadow-xl shadow-teal-500/20 hover:bg-teal-600 transition-all flex items-center justify-center gap-2">
                         {isSaving ? <Spinner weight="bold" className="w-4 h-4 animate-spin" /> : <CheckCircle weight="fill" className="w-4 h-4" />}
                         {isSaving ? 'SALVANDO...' : 'CONFIRMAR LOTE'}
                      </button>
                   </div>
                </div>
             </div>
             
             <p className="text-center text-white/30 text-[10px] mt-6 uppercase tracking-widest font-medium">
                Auditoria clínica via Gemini 3 Flash
             </p>
          </div>
        )}
      </div>

      <Toast message="Lote registrado com sucesso no banco de dados." isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
};