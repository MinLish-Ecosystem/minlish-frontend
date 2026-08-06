/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ─── WebGPU Types ────────────────────────────────────────────────────────────────
interface GPUAdapterInfo {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
}

interface GPUAdapter {
  info: GPUAdapterInfo;
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
}

interface GPUDeviceDescriptor extends Object {
  defaultQueue?: GPUQueueDescriptor;
  requiredFeatures?: Array<GPUFeatureName>;
  requiredLimits?: Record<string, number>;
}

type GPUFeatureName = string;

interface GPUSupportedFeatures {
  has(feature: string): boolean;
}

interface GPUSupportedLimits {
  maxTextureDimension1D: number;
  maxTextureDimension2D: number;
  maxTextureDimension3D: number;
  maxTextureArrayLayers: number;
  maxBindGroups: number;
}

interface GPUQueueDescriptor {
  label?: string;
}

interface GPUQueue {
  submit(commandBuffers: GPUCommandBuffer[]): undefined;
}

interface GPUCommandBuffer {
  label?: string;
}

interface GPUDevice extends EventTarget {
  label: string;
  queue: GPUQueue;
  features: GPUSupportedFeatures;
  limits: GPUSupportedLimits;
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
}

interface GPUShaderModuleDescriptor {
  code: string;
  sourceMap?: object;
}

interface GPUShaderModule {
  label?: string;
}

interface Navigator {
  gpu?: GPU;
}

interface GPU {
  requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
}

interface GPURequestAdapterOptions {
  powerPreference?: GPUPowerPreference;
  forceFallbackAdapter?: boolean;
}

type GPUPowerPreference = "low-power" | "high-performance" | "default";

