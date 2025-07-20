/**
 * Validates if a string is a valid UUID format
 * @param uuid - String to validate
 * @returns boolean - True if valid UUID, false otherwise
 */
export const validateUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validates if a string is a valid Stellar public key
 * @param publicKey - String to validate
 * @returns boolean - True if valid public key, false otherwise
 */
export const validateStellarPublicKey = (publicKey: string): boolean => {
  return publicKey.startsWith('G') && publicKey.length === 56;
};

/**
 * Validates if a string is a valid Stellar secret key
 * @param secretKey - String to validate
 * @returns boolean - True if valid secret key, false otherwise
 */
export const validateStellarSecretKey = (secretKey: string): boolean => {
  return secretKey.startsWith('S') && secretKey.length === 56;
};

/**
 * Validates if a string is a valid asset code for Stellar
 * @param assetCode - String to validate
 * @returns boolean - True if valid asset code, false otherwise
 */
export const validateAssetCode = (assetCode: string): boolean => {
  return assetCode.length >= 1 && assetCode.length <= 12 && /^[A-Z0-9]+$/.test(assetCode);
};

/**
 * Validates if a number is a positive amount
 * @param amount - Number to validate
 * @returns boolean - True if positive amount, false otherwise
 */
export const validatePositiveAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount > 0;
};

/**
 * Sanitizes a string by trimming whitespace
 * @param str - String to sanitize
 * @returns string - Sanitized string
 */
export const sanitizeString = (str: string): string => {
  return str.trim();
};
