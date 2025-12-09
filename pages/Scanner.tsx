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
  Package,
  CurrencyDollar,
  Plus,
  ArrowRight,
  MapPin,
  Spinner
} from '@phosphor-icons/react';
import { Toast } from '../components/Toast';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

type ScannerStep = 'idle' | 'camera' | 'review-photo' | 'processing' | 'result';

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

  const calculateStatusAndDays = (dateString: string) => {
    const today = new Date();
    let status: 'safe' | 'warning' | 'critical' = 'safe';
    let diffDays = 0;
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const expiry = new Date(year, month - 1, day);
        const diffTime = expiry.getTime() - today.getTime();
        diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) status = 'critical';
        else if (diffDays <= 90) status = 'warning';
        return { status, diffDays };
      }
    }
    return { status: 'safe', diffDays: 0 };
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
      setStep('review-photo');
    }
  };

  const handleAddMorePhotos = () => {
    if (capturedImages.length < 3) startCamera();
  };

  const handleProcessImages = async () => {
    setStep('processing');
    await processWithAI(capturedImages);
  };

  const processWithAI = async (images: string[]) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const parts: any[] = [{ text: "Analise as imagens fornecidas com extrema atenção." }];
      images.forEach((img) => {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } });
      });
      parts.push({ 
        text: `Objetivo: Extrair dados de um produto farmacêutico ou hospitalar.
        1. Identifique QUALQUER tipo de código presente: Código de Barras (EAN-13, UPC), QR Code, Datamatrix.
        2. Procure por textos de LOTE (Lot, L), VALIDADE (Val, Exp, Venc) e FABRICAÇÃO (Fab, Mfd).
        3. Identifique o Nome do Produto, Dosagem e Preço.
        Retorne APENAS um JSON:
        {
          "name": "Nome do produto completo",
          "lot": "Lote encontrado",
          "expiryDate": "DD/MM/YYYY",
          "manufactureDate": "DD/MM/YYYY",
          "barcode": "Conteúdo numérico",
          "codeType": "Tipo do código",
          "price": "Valor monetário encontrado",
          "confidence": número de 0 a 100
        }` 
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
        codeType: data.codeType || "Manual",
        price: data.price ? data.price.replace(',', '.') : "",
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
        name: 'Erro na leitura',
        manufacturerLot: 'ERRO',
        internalId: generateInternalId(),
        manufactureDate: '-',
        expiryDate: '-',
        barcode: '',
        codeType: '-',
        price: '',
        quantity: '1',
        aisle: '',
        shelf: '',
        confidence: 0,
        status: 'warning',
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

  const handleRescan = () => {
    setScannedData(null);
    setCapturedImages([]);
    startCamera();
  };

  const handleCancelScan = () => {
    stopCamera();
    setStep('idle');
    setCapturedImages([]);
  };

  return (
    <div className="min-h-screen bg-medical-dark flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* HEADER SCANNER */}
      <div className="px-4 py-4 flex items-center bg-medical-dark/95 backdrop-blur-sm fixed w-full top-0 z-30 text-white border-b border-white/10">
        <button onClick={() => navigate('/dashboard')} className="mr-3 p-1 hover:bg-white/10 rounded-full transition-colors">
          <CaretLeft weight="bold" className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Scan weight="duotone" className="w-5 h-5 text-medical-primary" />
          <h1 className="text-sm font-bold tracking-tight">Scanner Clínico</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 mt-16 pb-24 w-full">
        
        {/* IDLE STATE */}
        {step === 'idle' && (
          <div className="w-full max-w-sm flex flex-col items-center animate-fade-in space-y-6">
            <div className="w-full aspect-[4/3] border border-white/20 rounded-2xl flex flex-col items-center justify-center bg-white/5 relative overflow-hidden group hover:border-medical-primary/50 transition-colors">
              <Scan weight="thin" className="w-16 h-16 text-white/30 mb-4" />
              <p className="text-white/50 text-sm font-medium">Aguardando Produto</p>
            </div>

            <button
              onClick={startCamera}
              className="w-full bg-medical-primary hover:bg-teal-600 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-3 shadow-lg shadow-teal-500/20 transition-all active:scale-95"
            >
              <Camera weight="fill" className="w-6 h-6" />
              <span>INICIAR LEITURA DE LOTE</span>
            </button>
            
            <div className="flex gap-4 text-xs text-white/40 justify-center">
               <span className="flex items-center gap-1"><CheckCircle weight="fill" className="w-3 h-3" /> EAN-13</span>
               <span className="flex items-center gap-1"><CheckCircle weight="fill" className="w-3 h-3" /> Datamatrix</span>
            </div>
          </div>
        )}

        {/* CAMERA VIEW */}
        {step === 'camera' && (
          <div className="w-full h-full fixed inset-0 z-20 bg-black flex flex-col">
             <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
             
             {/* OVERLAY */}
             <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-[80%] aspect-square border-2 border-white/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]">
                   <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-medical-primary -mt-1 -ml-1"></div>
                   <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-medical-primary -mt-1 -mr-1"></div>
                   <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-medical-primary -mb-1 -ml-1"></div>
                   <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-medical-primary -mb-1 -mr-1"></div>
                   
                   <div className="absolute top-4 left-0 right-0 text-center">
                      <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full border border-white/20 backdrop-blur">
                        Posicione o código ou data
                      </span>
                   </div>
                </div>
             </div>

             <div className="absolute top-4 right-4 z-40">
                <button onClick={handleCancelScan} className="p-2 bg-black/40 text-white rounded-full backdrop-blur-md">
                   <X weight="bold" className="w-6 h-6" />
                </button>
             </div>

             <div className="absolute bottom-10 inset-x-0 flex justify-center z-40 px-8">
                <button onClick={handleCapture} className="w-20 h-20 bg-white rounded-full border-4 border-medical-primary/50 shadow-2xl flex items-center justify-center active:scale-90 transition-transform">
                   <div className="w-16 h-16 bg-white rounded-full border-2 border-slate-200"></div>
                </button>
             </div>
             
             <div className="absolute bottom-36 inset-x-0 text-center z-40 text-white text-sm font-medium drop-shadow-md">
                Foto {capturedImages.length + 1} de 3
             </div>
          </div>
        )}

        {/* REVIEW PHOTO */}
        {step === 'review-photo' && (
          <div className="w-full max-w-sm flex flex-col items-center animate-fade-in">
             <div className="w-full bg-white rounded-2xl p-6 shadow-2xl">
                <div className="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden mb-6 border border-slate-200 relative">
                   {capturedImages.length > 0 && <img src={`data:image/jpeg;base64,${capturedImages[capturedImages.length - 1]}`} className="w-full h-full object-cover" />}
                   <div className="absolute bottom-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle weight="fill" className="w-4 h-4" />
                   </div>
                </div>
                
                <h3 className="text-center font-bold text-medical-dark text-lg mb-1">Imagem Capturada</h3>
                <p className="text-center text-slate-400 text-xs mb-6">Certifique-se que os dados estão legíveis.</p>

                <div className="space-y-3">
                   {capturedImages.length < 3 && (
                      <button onClick={handleAddMorePhotos} className="w-full py-3 rounded-lg border border-medical-primary text-medical-primary font-semibold text-sm hover:bg-teal-50 transition-colors flex items-center justify-center gap-2">
                         <Plus weight="bold" className="w-4 h-4" /> Adicionar outro ângulo
                      </button>
                   )}
                   <button onClick={handleProcessImages} className="w-full py-3 rounded-lg bg-medical-primary text-white font-bold text-sm shadow-lg hover:bg-teal-600 transition-colors flex items-center justify-center gap-2">
                      Processar Imagens <ArrowRight weight="bold" className="w-4 h-4" />
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* PROCESSING */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center">
             <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-medical-primary border-t-transparent rounded-full animate-spin"></div>
                <Scan weight="duotone" className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
             </div>
             <p className="mt-8 text-white font-medium tracking-wide animate-pulse">ANALISANDO DADOS CLÍNICOS...</p>
          </div>
        )}

        {/* RESULT FORM */}
        {step === 'result' && scannedData && (
          <div className="w-full max-w-md animate-fade-in-up pb-10">
             <div className="bg-white rounded-t-2xl p-6 shadow-2xl border-b border-slate-100">
                <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold text-medical-dark text-lg">Validação de Lote</h3>
                   <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      scannedData.status === 'critical' ? 'bg-red-50 text-red-700 border-red-100' : 
                      scannedData.status === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                      'bg-green-50 text-green-700 border-green-100'
                   }`}>
                      {scannedData.status === 'critical' ? 'CRÍTICO' : scannedData.status === 'warning' ? 'ATENÇÃO' : 'APROVADO'}
                   </span>
                </div>

                {/* IMAGENS MINI */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                   {capturedImages.map((img, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                         <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover" />
                      </div>
                   ))}
                </div>

                <div className="space-y-4">
                   <div className="group">
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Produto</label>
                      <input 
                         type="text" 
                         value={scannedData.name} 
                         onChange={(e) => handleDataChange('name', e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-semibold text-medical-dark focus:ring-2 focus:ring-medical-primary outline-none transition-all" 
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lote</label>
                         <input 
                            type="text" 
                            value={scannedData.manufacturerLot} 
                            onChange={(e) => handleDataChange('manufacturerLot', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-mono text-medical-dark" 
                         />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Validade</label>
                         <input 
                            type="text" 
                            value={scannedData.expiryDate} 
                            onChange={(e) => handleDataChange('expiryDate', e.target.value)}
                            className={`w-full border rounded-lg p-3 text-sm font-bold outline-none ${
                               scannedData.status === 'critical' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-medical-dark'
                            }`} 
                         />
                      </div>
                   </div>

                   <div className="border-t border-slate-100 pt-4 mt-2">
                      <p className="text-xs font-bold text-medical-primary flex items-center mb-3">
                         <MapPin weight="fill" className="w-3 h-3 mr-1" /> Logística Interna
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                         <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">Corredor</label>
                            <input type="text" value={scannedData.aisle} onChange={(e) => handleDataChange('aisle', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-center font-bold text-sm" placeholder="A1" />
                         </div>
                         <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">Prateleira</label>
                            <input type="text" value={scannedData.shelf} onChange={(e) => handleDataChange('shelf', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-center font-bold text-sm" placeholder="P2" />
                         </div>
                         <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-1">Qtd</label>
                            <input type="number" value={scannedData.quantity} onChange={(e) => handleDataChange('quantity', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-center font-bold text-sm text-blue-600" />
                         </div>
                      </div>
                   </div>
                   
                   <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Preço Unitário (R$)</label>
                       <div className="relative">
                          <CurrencyDollar weight="bold" className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                          <input type="text" value={scannedData.price} onChange={(e) => handleDataChange('price', e.target.value)} className="w-full pl-9 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm font-mono text-medical-dark" placeholder="0.00" />
                       </div>
                   </div>
                </div>
             </div>
             
             <div className="bg-slate-50 p-4 rounded-b-2xl border-x border-b border-slate-200 grid grid-cols-2 gap-4">
                <button onClick={handleRescan} disabled={isSaving} className="py-3 rounded-lg border border-slate-300 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                   <ArrowsClockwise weight="bold" className="w-4 h-4" />
                   Reiniciar
                </button>
                <button onClick={handleConfirm} disabled={isSaving} className="py-3 rounded-lg bg-medical-primary text-white font-bold text-sm shadow-md hover:bg-teal-600 transition-colors flex items-center justify-center gap-2">
                   {isSaving ? <Spinner weight="bold" className="w-4 h-4 animate-spin" /> : <CheckCircle weight="fill" className="w-4 h-4" />}
                   {isSaving ? 'Registrando...' : 'Confirmar Lote'}
                </button>
             </div>
          </div>
        )}
      </div>

      <Toast message="Lote registrado com sucesso no sistema clínico." isVisible={showToast} onClose={() => setShowToast(false)} />
    </div>
  );
};