const HEADER_CLASSES = "p-8 pb-4 flex-shrink-0 relative";
import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { MetalType, GemType, SkinTone, RingModelType } from "../types/index";
import { OptionGrid, OptionItemData } from "./Configurator/OptionGrid";
import {
  createMetalOptions,
  createGemOptions,
  getDiamondShapeOptionsForRing,
  createSkinToneOptions,
  createRingModelOptions,
  DiamondShape,
} from "../constants/optionConfig";

interface ConfiguratorUIProps {
  metal: MetalType;
  setMetal: (m: MetalType) => void;
  gem: GemType;
  setGem: (g: GemType) => void;
  diamondShape: DiamondShape;
  setDiamondShape: (s: DiamondShape) => void;
  ringModel: RingModelType;
  setRingModel: (r: RingModelType) => void;
  autoRotate: boolean;
  setAutoRotate: (value: boolean) => void;
  skinTone: SkinTone;
  setSkinTone: (t: SkinTone) => void;
  renderMode: "performance" | "quality";
  setRenderMode: (m: "performance" | "quality") => void;
  onClose?: () => void;
  onOpen?: () => void;
  externalOpen?: boolean;
}

// Cache ring config globally to avoid re-fetching
let cachedRingConfig: {
  rings: Record<string, { heads?: Record<string, string>; visible?: boolean }>;
  diamondEXR?: string;
} | null = null;
let configLoadPromise: Promise<any> | null = null;

const loadRingConfigOnce = async () => {
  if (cachedRingConfig) return cachedRingConfig;
  if (configLoadPromise) return configLoadPromise;

  configLoadPromise = fetch("/assets/ring-config.json")
    .then((res) => res.json())
    .then((data) => {
      cachedRingConfig = data;
      return data;
    })
    .catch((err) => {
      console.error("Failed to load ring config:", err);
      return null;
    });

  return configLoadPromise;
};

export const ConfiguratorUI: React.FC<ConfiguratorUIProps> = React.memo(
  ({
    metal,
    setMetal,
    gem,
    setGem,
    diamondShape,
    setDiamondShape,
    ringModel,
    setRingModel,
    autoRotate,
    setAutoRotate,
    skinTone,
    setSkinTone,
    renderMode,
    setRenderMode,
    onClose,
    onOpen,
    externalOpen,
  }) => {
    const [ringConfig, setRingConfig] = useState<{
      rings: Record<string, { heads?: Record<string, string>; visible?: boolean }>;
      diamondEXR?: string;
    } | null>(cachedRingConfig);

    useEffect(() => {
      if (!ringConfig) {
        loadRingConfigOnce().then((data) => {
          if (data) setRingConfig(data);
        });
      }
    }, [ringConfig]);

    const [isOpen, setIsOpen] = useState<boolean>(false);

    // sync with external control from parent App
    useEffect(() => {
      if (typeof externalOpen !== 'undefined' && externalOpen !== isOpen) {
        setIsOpen(!!externalOpen);
      }
    }, [externalOpen]);

    const metalOptions = useMemo(() => createMetalOptions(), []);
    const gemOptions = useMemo(() => createGemOptions(), []);
    const skinToneOptions = useMemo(() => createSkinToneOptions(), []);

    const diamondShapeOptions = useMemo(() => {
      if (!ringConfig) {
        return [
          { value: "round" as DiamondShape, label: "Round", previewImage: "/assets/shapes/Round.svg", disabled: false },
          { value: "radiant" as DiamondShape, label: "Radiant", previewImage: "/assets/shapes/Radiant.svg", disabled: false },
          { value: "princess" as DiamondShape, label: "Princess", previewImage: "/assets/shapes/Princess.svg", disabled: false },
          { value: "pear" as DiamondShape, label: "Pear", previewImage: "/assets/shapes/Pear.svg", disabled: false },
          { value: "marquise" as DiamondShape, label: "Marquise", previewImage: "/assets/shapes/Marquise.svg", disabled: false },
          { value: "heart" as DiamondShape, label: "Heart", previewImage: "/assets/shapes/Heart.svg", disabled: false },
          { value: "emerald" as DiamondShape, label: "Emerald", previewImage: "/assets/shapes/Emerald.svg", disabled: false },
        ];
      }

      const currentRing = ringConfig.rings[ringModel];
      if (!currentRing || !currentRing.heads) return getDiamondShapeOptionsForRing(ringModel, []);
      const availableHeads = Object.keys(currentRing.heads);
      return getDiamondShapeOptionsForRing(ringModel, availableHeads);
    }, [ringConfig, ringModel]);

    const prevRingModelRef = useRef(ringModel);
    useEffect(() => {
      if (!ringConfig || prevRingModelRef.current === ringModel) return;
      prevRingModelRef.current = ringModel;
      const currentRing = ringConfig.rings[ringModel];
      if (!currentRing || !currentRing.heads) return;
      const availableHeads = Object.keys(currentRing.heads);
      const shapeMapping: Record<string, string[]> = { radiant: ["radiant", "emerald"], marquise: ["marquise", "heart"] };
      const isAvailable = availableHeads.some((headKey) => {
        const mapping = shapeMapping[headKey];
        return mapping?.includes(diamondShape) || headKey === diamondShape;
      });
      if (!isAvailable) {
        const firstAvailable = availableHeads[0];
        if (firstAvailable) {
          const standardShape = firstAvailable === "emerald" ? "radiant" : (firstAvailable === "heart" || firstAvailable === "marquise1" || firstAvailable === "marquise") ? "marquise" : (firstAvailable as DiamondShape);
          setDiamondShape(standardShape);
        }
      }
    }, [ringModel, ringConfig, diamondShape, setDiamondShape]);

    const renderModeOptions = useMemo<ReadonlyArray<OptionItemData<"performance" | "quality">>>(() => [
      { value: "performance", label: "Performance", previewImage: "/assets/images/performance.png" },
      { value: "quality", label: "Fire", previewImage: "/assets/images/fire.webp" },
    ], []);

    const [activeTab, setActiveTab] = useState<'gem' | 'shape'>('gem');

    const handleMetalSelect = useCallback((value: MetalType | boolean) => { if (typeof value !== 'boolean') setMetal(value); }, [setMetal]);
    const handleGemSelect = useCallback((value: GemType | boolean) => { if (typeof value !== 'boolean') setGem(value); }, [setGem]);
    const handleDiamondShapeSelect = useCallback((value: DiamondShape | boolean) => { if (typeof value !== 'boolean') setDiamondShape(value); }, [setDiamondShape]);
    const handleSkinToneSelect = useCallback((value: SkinTone | boolean) => { if (typeof value !== 'boolean') setSkinTone(value); }, [setSkinTone]);
    const handleRingModelSelect = useCallback((value: RingModelType | boolean) => { if (typeof value !== 'boolean') setRingModel(value); }, [setRingModel]);
    const handleRenderModeSelect = useCallback((value: 'performance' | 'quality' | boolean) => { if (typeof value !== 'boolean') setRenderMode(value); }, [setRenderMode]);

    return (
      <>
        
          {/* Customize button moved to App for both mobile and desktop to avoid blocking scene interaction */}

        <div className={`fixed left-1/2 bottom-8 transform -translate-x-1/2 z-50 w-full sm:w-[400px] md:w-[450px] lg:w-[520px] ml-0 sm:ml-[250px] md:ml-[350px] lg:ml-[480px] transition-transform duration-300 ease-out ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}`}>
          <div className="bg-white rounded-3xl shadow-2xl p-3">
            <div className="flex items-center justify-end">
              <button onClick={() => { setIsOpen(false); onClose?.(); }} className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center">✕</button>
            </div>

            <div className="mt-4">
              <div className="flex gap-3 bg-gray-100 p-2 rounded-full">
                <button onClick={() => setActiveTab('gem')} className={`px-3 py-1 rounded-full text-sm font-medium ${activeTab === 'gem' ? 'bg-white text-black' : 'text-gray-600'}`}>Gemstone</button>
                <button onClick={() => setActiveTab('shape')} className={`px-3 py-1 rounded-full text-sm font-medium ${activeTab === 'shape' ? 'bg-white text-black' : 'text-gray-600'}`}>Diamond shape</button>
              </div>

              <div className="mt-4 max-h-[260px] overflow-auto">
                <div className="space-y-4">
                  {activeTab === 'gem' && (
                    <OptionGrid title="Gemstone" options={gemOptions} selectedValue={gem} onSelect={handleGemSelect} />
                  )}

                  {activeTab === 'shape' && (
                    <OptionGrid title="Diamond Shape" options={diamondShapeOptions} selectedValue={diamondShape} onSelect={handleDiamondShapeSelect} />
                  )}

                  <OptionGrid title="Render Mode" options={renderModeOptions} selectedValue={renderMode} onSelect={handleRenderModeSelect} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.metal === nextProps.metal &&
      prevProps.gem === nextProps.gem &&
      prevProps.diamondShape === nextProps.diamondShape &&
      prevProps.ringModel === nextProps.ringModel &&
      prevProps.autoRotate === nextProps.autoRotate &&
      prevProps.skinTone === nextProps.skinTone &&
      prevProps.renderMode === nextProps.renderMode &&
      prevProps.externalOpen === nextProps.externalOpen &&
      prevProps.onOpen === nextProps.onOpen &&
      prevProps.onClose === nextProps.onClose
    );
  }
);
