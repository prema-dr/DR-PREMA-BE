import { Transform } from 'class-transformer';

// Multipart forms send every field as a string, so booleans/JSON/empty strings need explicit coercion.
export const ToBoolean = () =>
  Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1') return true;
    if (value === 'false' || value === false || value === '0') return false;
    return value;
  });

export const EmptyToNull = () => Transform(({ value }) => (value === '' ? null : value));

export const ParseJson = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  });

export const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

// Lowercases and strips surrounding slashes so "/VBAC/Myths/" becomes "vbac/myths"; empty becomes null.
export const NormalizePath = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const cleaned = value.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    return cleaned === '' ? null : cleaned;
  });
