/** Convierte un código ISO 3166-1 alpha-2 ("CL", "AR", "US"...) en su emoji de bandera. */
export function countryCodeToFlag(code: string): string {
  if (!/^[a-zA-Z]{2}$/.test(code)) return "🏳️";
  const upper = code.toUpperCase();
  const codePoints = [...upper].map((c) => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
