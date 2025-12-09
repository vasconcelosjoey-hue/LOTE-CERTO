import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { 
  ChevronLeft, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  RefreshCcw, 
  Scan,
  AlertTriangle,
  X,
  Barcode,
  ArrowRight,
  Tag,
  Pencil,
  Calendar,
  Package,
  PackageCheck,
  DollarSign,
  Plus,
  Image as ImageIcon,
  QrCode,
  MapPin,
  Layers,
  Hash
} from 'lucide-react';
import { Toast } from '../components/Toast';

// Estados do fluxo de scanner
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
  quantity: string; // Novo input
  aisle: string;    // Novo input
  shelf: string;    // Novo input
  confidence: number;
  status: 'warning' | 'safe' | 'critical';
  daysRemaining: number;
  images: string[];
}

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<ScannerStep>('idle');
  const [showToast, setShowToast] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Inicializa a câmera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
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

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const generateInternalId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
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
    if (capturedImages.length < 3) {
      startCamera();
    }
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
        parts.push({ 
          inlineData: { 
            mimeType: 'image/jpeg', 
            data: img 
          } 
        });
      });

      parts.push({ 
        text: `
        Objetivo: Extrair dados de um produto farmacêutico ou hospitalar.
        
        1. Identifique QUALQUER tipo de código presente: Código de Barras (EAN-13, UPC), QR Code, Datamatrix (comum em remédios), etc.
        2. Procure por textos de LOTE (Lot, L), VALIDADE (Val, Exp, Venc) e FABRICAÇÃO (Fab, Mfd). Atenção a textos em baixo/alto relevo.
        3. Identifique o Nome do Produto, Dosagem e Preço (se houver etiqueta).

        Retorne APENAS um JSON:
        {
          "name": "Nome do produto completo",
          "lot": "Lote encontrado",
          "expiryDate": "DD/MM/YYYY",
          "manufactureDate": "DD/MM/YYYY",
          "barcode": "Conteúdo numérico ou texto do código lido",
          "codeType": "Tipo do código (ex: EAN-13, QR Code, Datamatrix, Desconhecido)",
          "price": "Valor monetário encontrado (ex: 19.90)",
          "confidence": número de 0 a 100
        }
        ` 
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
        quantity: "1", // Default quantity
        aisle: "",     // Default location
        shelf: "",     // Default location
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
      setScannedData({
        ...scannedData,
        expiryDate: value,
        status,
        daysRemaining: diffDays
      });
    } else {
      setScannedData({
        ...scannedData,
        [field]: value
      });
    }
  };

  const handleConfirm = () => {
    if (scannedData) {
      const newProduct = {
        id: scannedData.internalId,
        name: scannedData.name,
        lot: scannedData.manufacturerLot,
        expiryDate: scannedData.expiryDate,
        daysRemaining: scannedData.daysRemaining,
        status: scannedData.status,
        manufactureDate: scannedData.manufactureDate,
        quantity: parseInt(scannedData.quantity) || 0,
        unitPrice: parseFloat(scannedData.price) || 0,
        location: {
          aisle: scannedData.aisle.toUpperCase(),
          shelf: scannedData.shelf.toUpperCase()
        },
        images: scannedData.images,
        codeType: scannedData.codeType
      };
      
      const savedProducts = JSON.parse(localStorage.getItem('lote-certo-products') || '[]');
      localStorage.setItem('lote-certo-products', JSON.stringify([...savedProducts, newProduct]));
    }

    setShowToast(true);
    setTimeout(() => {
      navigate('/');
    }, 1500);
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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="px-4 py-4 flex items-center bg-slate-900/90 backdrop-blur-sm fixed w-full top-0 z-20 text-white border-b border-slate-700">
        <button 
          onClick={() => navigate('/')}
          className="mr-3 p-1 hover:bg-slate-700 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1.5 rounded-lg border border-white/10">
            <PackageCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-none">
              LOTE <span className="font-light text-slate-300">CERTO</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 mt-16 pb-24 w-full">
        
        {/* ESTADO INICIAL */}
        {step === 'idle' && (
          <div className="w-full max-w-sm flex flex-col items-center animate-fade-in space-y-4">
            <div className="w-full aspect-video border-2 border-dashed border-slate-600 rounded-2xl flex flex-col items-center justify-center bg-slate-800/30 relative overflow-hidden group">
              <Scan className="w-12 h-12 text-slate-500 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-slate-400 text-sm">Posicione o produto</p>
            </div>

            <button
              onClick={startCamera}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-3 shadow-lg shadow-blue-900/50 transition-all active:scale-95"
            >
              <Camera className="w-6 h-6" />
              <span>INICIAR LEITURA</span>
            </button>
            
            <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-slate-700 w-full">
              <h3 className="text-white text-sm font-semibold mb-2 flex items-center">
                <QrCode className="w-4 h-4 mr-2 text-blue-400" />
                Suporte Universal
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                O sistema identifica códigos (EAN, Datamatrix) e extrai lote/validade automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* CÂMERA */}
        {step === 'camera' && (
          <div className="w-full max-w-md flex flex-col items-center relative h-[80vh]">
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-[3px] border-white/30 rounded-2xl pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-64 border-2 border-white/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 -mt-0.5 -ml-0.5"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 -mt-0.5 -mr-0.5"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 -mb-0.5 -ml-0.5"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 -mb-0.5 -mr-0.5"></div>
                </div>
                
                <div className="absolute top-6 w-full text-center px-4">
                  <span className="bg-black/60 text-white px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-md border border-white/10 shadow-lg">
                    Foto {capturedImages.length + 1} de 3
                  </span>
                  <p className="text-xs text-white/90 mt-2 drop-shadow-md font-medium">
                    Enquadre código, lote ou validade
                  </p>
                </div>
              </div>

              <button 
                onClick={handleCancelScan}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm z-30"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute bottom-8 w-full px-8 z-30">
              <button
                onClick={handleCapture}
                className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:bg-slate-100 active:scale-95 transition-all"
              >
                <div className="w-6 h-6 rounded-full border-4 border-slate-900 mr-2"></div>
                <span>CAPTURAR</span>
              </button>
            </div>
          </div>
        )}

        {/* REVISÃO DA FOTO */}
        {step === 'review-photo' && (
          <div className="w-full max-w-sm animate-fade-in flex flex-col items-center">
            <div className="bg-slate-800 p-6 rounded-2xl w-full border border-slate-700 shadow-2xl">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <div className="w-20 h-20 bg-slate-700 rounded-lg overflow-hidden border-2 border-slate-600">
                     {capturedImages.length > 0 && (
                       <img src={`data:image/jpeg;base64,${capturedImages[capturedImages.length - 1]}`} className="w-full h-full object-cover" alt="Capture" />
                     )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full p-1 border-2 border-slate-800">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Foto {capturedImages.length} capturada!</h3>
              </div>

              <div className="space-y-3">
                {capturedImages.length < 3 ? (
                  <>
                    <button
                      onClick={handleAddMorePhotos}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-colors border border-slate-600"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Adicionar outra parte (Frente/Lado)</span>
                    </button>
                    <button
                      onClick={handleProcessImages}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg"
                    >
                      <span>Processar Imagens</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-yellow-400 text-sm mb-3 font-medium">Limite de 3 fotos atingido.</p>
                    <button
                      onClick={handleProcessImages}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-lg"
                    >
                      <span>Processar Agora</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PROCESSAMENTO */}
        {step === 'processing' && (
          <div className="w-full max-w-sm flex flex-col items-center justify-center h-64">
            <div className="relative">
               <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <Scan className="w-8 h-8 text-blue-500 animate-pulse" />
               </div>
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Processando...</h3>
          </div>
        )}

        {/* RESULTADO (FORMULÁRIO DE EDIÇÃO) */}
        {step === 'result' && scannedData && (
          <div className="w-full max-w-sm animate-fade-in-up">
            <div className="bg-white rounded-2xl p-6 shadow-xl mb-6">
              
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Validar Informações</h3>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border flex items-center ${
                    scannedData.status === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                    scannedData.status === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    'bg-green-100 text-green-800 border-green-200'
                  }`}>
                    {scannedData.status === 'critical' ? 'Crítico (D-30)' : 
                     scannedData.status === 'warning' ? 'Atenção (D-90)' : 'OK'}
                  </span>
                </div>
              </div>

               {/* Miniaturas */}
               <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {capturedImages.map((img, idx) => (
                  <div key={idx} className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0">
                    <img src={`data:image/jpeg;base64,${img}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* CAMPOS EDITÁVEIS - GRID */}
              <div className="grid grid-cols-12 gap-3">
                
                {/* Nome (12 cols) */}
                <div className="col-span-12">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Produto</label>
                  <input 
                    type="text" 
                    value={scannedData.name}
                    onChange={(e) => handleDataChange('name', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-900 font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Lote (6 cols) */}
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Lote</label>
                  <input 
                    type="text" 
                    value={scannedData.manufacturerLot}
                    onChange={(e) => handleDataChange('manufacturerLot', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-900 text-sm"
                  />
                </div>

                {/* Validade (6 cols) */}
                <div className="col-span-6">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Validade</label>
                  <input 
                    type="text" 
                    value={scannedData.expiryDate}
                    onChange={(e) => handleDataChange('expiryDate', e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className={`w-full border rounded-lg py-2 px-3 font-bold text-sm outline-none ${
                      scannedData.status === 'critical' ? 'border-red-300 text-red-700 bg-red-50' : 'border-slate-200'
                    }`}
                  />
                </div>

                {/* DIVISOR DE LOCALIZAÇÃO */}
                <div className="col-span-12 mt-2 mb-1 border-t border-slate-100 pt-2">
                  <p className="text-xs font-bold text-slate-700 flex items-center">
                    <MapPin className="w-3 h-3 mr-1 text-blue-500" /> Endereçamento & Estoque
                  </p>
                </div>

                {/* Localização (Corredor/Prateleira) */}
                <div className="col-span-4">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Corredor</label>
                  <input 
                    type="text" 
                    value={scannedData.aisle}
                    onChange={(e) => handleDataChange('aisle', e.target.value)}
                    placeholder="Ex: A1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-center text-sm font-bold uppercase"
                  />
                </div>
                <div className="col-span-4">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Prateleira</label>
                  <input 
                    type="text" 
                    value={scannedData.shelf}
                    onChange={(e) => handleDataChange('shelf', e.target.value)}
                    placeholder="Ex: P2"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-center text-sm font-bold uppercase"
                  />
                </div>

                {/* Quantidade */}
                <div className="col-span-4">
                  <label className="block text-[10px] font-medium text-slate-500 mb-1">Qtd (Un)</label>
                  <input 
                    type="number" 
                    value={scannedData.quantity}
                    onChange={(e) => handleDataChange('quantity', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-center text-sm font-bold text-blue-700"
                  />
                </div>

                {/* Preço de Custo */}
                 <div className="col-span-12">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Preço Unitário (R$) - Para cálculo de perda</label>
                    <div className="relative">
                       <input 
                        type="text" 
                        value={scannedData.price}
                        onChange={(e) => handleDataChange('price', e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-2 text-slate-900 font-mono text-sm"
                      />
                       <DollarSign className="w-3 h-3 text-slate-400 absolute right-2 top-3 pointer-events-none" />
                    </div>
                  </div>

              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleRescan}
                className="flex items-center justify-center space-x-2 bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Reiniciar</span>
              </button>
              <button 
                onClick={handleConfirm}
                className="flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-500 shadow-lg shadow-green-900/20 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar & Controlar</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <Toast 
        message="Lote endereçado e salvo com sucesso!" 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
};