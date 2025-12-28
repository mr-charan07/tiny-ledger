import { z } from 'zod';

// IoT Data Validation Schemas
export const iotDataSchema = z.object({
  deviceName: z.string()
    .min(1, 'Device name is required')
    .max(64, 'Device name must be less than 64 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Device name can only contain letters, numbers, underscores and hyphens'),
  dataType: z.string()
    .min(1, 'Data type is required')
    .max(32, 'Data type must be less than 32 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Data type can only contain letters, numbers and underscores'),
  value: z.number()
    .min(-2147483648, 'Value must be within int256 range')
    .max(2147483647, 'Value must be within int256 range'),
});

export const deviceRegistrationSchema = z.object({
  deviceAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  name: z.string()
    .min(1, 'Device name is required')
    .max(64, 'Device name must be less than 64 characters'),
  deviceType: z.enum(['sensor', 'actuator', 'gateway'], {
    errorMap: () => ({ message: 'Device type must be sensor, actuator, or gateway' })
  }),
  permission: z.number().min(0).max(2),
});

export const nodeRegistrationSchema = z.object({
  nodeAddress: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  name: z.string()
    .min(1, 'Node name is required')
    .max(64, 'Node name must be less than 64 characters'),
  isValidator: z.boolean(),
});

export const tokenVerificationSchema = z.object({
  token: z.string()
    .min(10, 'Token must be at least 10 characters')
    .max(128, 'Token must be less than 128 characters'),
});

// Validation helper functions
export function validateIoTData(data: unknown) {
  return iotDataSchema.safeParse(data);
}

export function validateDeviceRegistration(data: unknown) {
  return deviceRegistrationSchema.safeParse(data);
}

export function validateNodeRegistration(data: unknown) {
  return nodeRegistrationSchema.safeParse(data);
}

export function validateToken(token: unknown) {
  return tokenVerificationSchema.safeParse({ token });
}

// Data integrity validation
export function validateDataIntegrity(value: number, dataType: string): { valid: boolean; error?: string } {
  const ranges: Record<string, { min: number; max: number }> = {
    temperature: { min: -100, max: 200 },
    humidity: { min: 0, max: 100 },
    pressure: { min: 300, max: 1100 },
    voltage: { min: 0, max: 500 },
    current: { min: 0, max: 1000 },
    light: { min: 0, max: 100000 },
    motion: { min: 0, max: 1 },
    co2: { min: 0, max: 10000 },
    ph: { min: 0, max: 14 },
  };

  const range = ranges[dataType.toLowerCase()];
  if (range) {
    if (value < range.min || value > range.max) {
      return { 
        valid: false, 
        error: `${dataType} value must be between ${range.min} and ${range.max}` 
      };
    }
  }

  return { valid: true };
}
