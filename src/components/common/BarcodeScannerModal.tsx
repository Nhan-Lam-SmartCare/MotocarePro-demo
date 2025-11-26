import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Camera, FlashlightOff, Flashlight, SwitchCamera } from "lucide-react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = "Quét mã vạch",
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [lastScanned, setLastScanned] = useState<string>("");
  const [scanCount, setScanCount] = useState(0);
  const lastScanTime = useRef<number>(0);
  const lastScanCode = useRef<string>("");
  const processingRef = useRef<boolean>(false);
  const onScanRef = useRef(onScan);

  // Keep onScan ref updated
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  // Debounce: 3 giây giữa các lần quét CÙNG mã, 1.5s cho mã khác
  const SAME_CODE_COOLDOWN = 3000;
  const DIFF_CODE_COOLDOWN = 1500;

  // Memoized scan handler - sử dụng ref để tránh dependency issues
  const handleScanResult = useCallback((decodedText: string) => {
    const now = Date.now();
    const isSameCode = decodedText === lastScanCode.current;
    const cooldown = isSameCode ? SAME_CODE_COOLDOWN : DIFF_CODE_COOLDOWN;
    
    // Debounce check
    if (now - lastScanTime.current < cooldown) {
      return;
    }
    
    // Prevent concurrent processing
    if (processingRef.current) {
      return;
    }
    
    processingRef.current = true;
    lastScanTime.current = now;
    lastScanCode.current = decodedText;
    
    setLastScanned(decodedText);
    setScanCount(prev => prev + 1);
    
    // Vibrate on scan (mobile) - chỉ 1 lần ngắn
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
    
    // Call parent handler thông qua ref
    onScanRef.current(decodedText);
    
    // Reset processing flag after cooldown
    setTimeout(() => {
      processingRef.current = false;
    }, 1000);
  }, []); // Empty deps - sử dụng ref

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const startScanner = async () => {
    try {
      setError(null);
      
      // Stop existing scanner if any
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === Html5QrcodeScannerState.SCANNING) {
            await scannerRef.current.stop();
          }
        } catch (e) {
          // Ignore
        }
        scannerRef.current.clear();
      }

      const scanner = new Html5Qrcode("barcode-scanner-container");
      scannerRef.current = scanner;

      const config = {
        fps: 5, // Giảm FPS để giảm spam
        qrbox: { width: 280, height: 150 },
        aspectRatio: 1.5,
        disableFlip: false,
      };

      await scanner.start(
        { facingMode },
        config,
        handleScanResult,
        () => {
          // Ignore scan errors (no code found)
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Scanner error:", err);
      if (err.toString().includes("NotAllowedError")) {
        setError("Vui lòng cấp quyền camera để quét mã vạch");
      } else if (err.toString().includes("NotFoundError")) {
        setError("Không tìm thấy camera trên thiết bị");
      } else {
        setError("Không thể khởi động camera: " + (err.message || err));
      }
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setLastScanned("");
    setScanCount(0);
    lastScanCode.current = "";
    lastScanTime.current = 0;
    processingRef.current = false;
  };

  const toggleTorch = async () => {
    try {
      const track = (scannerRef.current as any)?.getRunningTrackCameraCapabilities?.();
      if (track?.torchFeature?.isSupported()) {
        await track.torchFeature.apply(!torchOn);
        setTorchOn(!torchOn);
      }
    } catch (e) {
      console.log("Torch not supported");
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex flex-col z-[100]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5" />
          {title}
        </h2>
        <button
          onClick={handleClose}
          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {error ? (
          <div className="text-center">
            <div className="text-red-400 mb-4 px-4">{error}</div>
            <button
              onClick={startScanner}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {/* Scanner container */}
            <div className="relative w-full max-w-sm">
              <div
                id="barcode-scanner-container"
                className="w-full rounded-xl overflow-hidden bg-black"
                style={{ minHeight: 300 }}
              />
              
              {/* Scan frame overlay */}
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[280px] h-[150px] relative">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br" />
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-x-0 h-0.5 bg-green-400 animate-scan" />
                  </div>
                </div>
              )}
            </div>

            {/* Last scanned */}
            {lastScanned && (
              <div className="mt-4 px-4 py-2 bg-green-600/20 border border-green-500 rounded-lg">
                <p className="text-green-400 text-sm text-center font-mono">
                  ✓ {lastScanned} {scanCount > 1 && <span className="text-green-300">(×{scanCount})</span>}
                </p>
              </div>
            )}

            {/* Instructions */}
            <p className="text-white/70 text-sm mt-4 text-center px-4">
              Đưa mã vạch vào khung hình để quét
            </p>
          </>
        )}
      </div>

      {/* Controls */}
      {isScanning && (
        <div className="flex items-center justify-center gap-6 p-6 bg-black/50">
          <button
            onClick={toggleTorch}
            className={`p-4 rounded-full ${torchOn ? "bg-yellow-500 text-black" : "bg-white/20 text-white"}`}
            title="Đèn flash"
          >
            {torchOn ? <Flashlight className="w-6 h-6" /> : <FlashlightOff className="w-6 h-6" />}
          </button>
          <button
            onClick={switchCamera}
            className="p-4 rounded-full bg-white/20 text-white"
            title="Đổi camera"
          >
            <SwitchCamera className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* CSS for scan animation */}
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: calc(100% - 2px); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default BarcodeScannerModal;
