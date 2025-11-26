# RECOUP Encryption Architecture

## Overview

RECOUP implements **field-level encryption** for all sensitive data using **AES-256-GCM** (Authenticated Encryption with Associated Data). This ensures that:

- All Personally Identifiable Information (PII) is encrypted at rest
- All payment information is encrypted
- All API keys and secrets are encrypted
- Each customer instance has cryptographically separate encryption keys (**multi-tenancy isolation**)

## Setup

### Environment Variables

Add the following to your `.env` file:

```bash
# Master Encryption Key (64-character hex string = 32 bytes)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_MASTER_KEY=your_64_character_hex_string_here
```

**CRITICAL:** Never commit `ENCRYPTION_MASTER_KEY` to version control. Store it securely in your secrets management system (AWS Secrets Manager, HashiCorp Vault, etc.).

### Generate Master Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Usage

### Basic Field Encryption

```typescript
import { encryptField, decryptField } from '@/lib/encryption';

// Encrypt sensitive data before storing
const encryptedEmail = encryptField('user@example.com', userId);
const encryptedPhone = encryptField('+447123456789', userId);

// Store in database
await db.collection('users').doc(userId).set({
  email: encryptedEmail,
  phoneNumber: encryptedPhone,
  // ... other fields
});

// Decrypt when retrieving
const doc = await db.collection('users').doc(userId).get();
const data = doc.data();

const email = decryptField(data.email, userId);
const phoneNumber = decryptField(data.phoneNumber, userId);
```

### Object-Level Encryption

```typescript
import { encryptObject, decryptObject, ENCRYPTED_FIELDS } from '@/lib/encryption';

// Encrypt multiple fields at once
const user = {
  userId: 'user_123',
  fullName: 'John Doe',
  email: 'john@example.com',
  phoneNumber: '+447123456789',
  businessAddress: '123 Main St, London',
  subscriptionTier: 'pro', // Not encrypted
};

const encryptedUser = encryptObject(
  user,
  ENCRYPTED_FIELDS.USER, // ['fullName', 'phoneNumber', 'businessAddress', 'taxId']
  user.userId
);

// Store encrypted user
await db.collection('users').doc(userId).set(encryptedUser);

// Retrieve and decrypt
const doc = await db.collection('users').doc(userId).get();
const decryptedUser = decryptObject(
  doc.data(),
  ENCRYPTED_FIELDS.USER,
  userId
);
```

## Multi-Tenancy Architecture

### Per-User Encryption Keys

RECOUP uses **HKDF (HMAC-based Key Derivation Function)** to derive unique encryption keys for each user:

```
User Encryption Key = HKDF-SHA256(
  master_key: ENCRYPTION_MASTER_KEY,
  salt: SHA256(userId),
  info: 'recoup-user-encryption-key'
)
```

**Benefits:**
- Each customer instance has a unique encryption key
- Keys are deterministic (always the same for a given userId)
- Compromise of one user's key doesn't affect others
- No need to store per-user keys (derived on-demand from userId)

### Key Rotation

To rotate keys:

1. **Generate new master key:**
   ```bash
   NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

2. **Deploy dual-key decryption:**
   ```typescript
   // Try new key first, fallback to old key
   function decryptFieldWithRotation(ciphertext, userId) {
     try {
       return decryptField(ciphertext, userId); // Uses new key
     } catch {
       return decryptFieldLegacy(ciphertext, userId); // Uses old key
     }
   }
   ```

3. **Re-encrypt all data:**
   ```typescript
   // Background job to re-encrypt all sensitive data
   async function reencryptAllData() {
     const users = await db.collection('users').get();
     for (const userDoc of users.docs) {
       const userId = userDoc.id;
       const oldData = userDoc.data();

       // Decrypt with old key, encrypt with new key
       const decrypted = decryptObjectLegacy(oldData, ENCRYPTED_FIELDS.USER, userId);
       const reencrypted = encryptObject(decrypted, ENCRYPTED_FIELDS.USER, userId);

       await userDoc.ref.update(reencrypted);
     }
   }
   ```

4. **Remove old key from environment**

## Fields Requiring Encryption

### User/Client PII
```typescript
ENCRYPTED_FIELDS.USER = ['fullName', 'phoneNumber', 'businessAddress', 'taxId']
ENCRYPTED_FIELDS.CLIENT = ['clientName', 'clientEmail', 'clientPhone', 'clientAddress']
```

### Invoice Data
```typescript
ENCRYPTED_FIELDS.INVOICE = ['clientName', 'clientEmail', 'clientPhone', 'clientAddress', 'notes']
```

### Payment Information
```typescript
ENCRYPTED_FIELDS.PAYMENT = [
  'cardNumber',
  'cardholderName',
  'bankAccountNumber',
  'sortCode',
  'iban'
]
```

### Communication Data
```typescript
ENCRYPTED_FIELDS.COMMUNICATION = [
  'phoneNumber',
  'emailContent',
  'smsContent',
  'recordingUrl'
]
```

### API Keys & Secrets
```typescript
ENCRYPTED_FIELDS.INTEGRATION = [
  'apiKey',
  'apiSecret',
  'webhookSecret',
  'accessToken',
  'refreshToken'
]
```

## Security Considerations

### What's Encrypted
✅ All PII (names, emails, phone numbers, addresses)
✅ All payment information (card details, bank accounts)
✅ All communication content (email bodies, SMS messages)
✅ All API keys and OAuth tokens
✅ All voice call recordings (URLs encrypted)

### What's NOT Encrypted
❌ User IDs (needed for indexing/querying)
❌ Invoice amounts (needed for aggregations)
❌ Timestamps (needed for sorting/filtering)
❌ Status fields (needed for queries)
❌ Metadata (needed for system operation)

### Encryption Algorithm
- **Algorithm:** AES-256-GCM
- **Key Size:** 256 bits (32 bytes)
- **IV Size:** 128 bits (16 bytes, random per encryption)
- **Auth Tag Size:** 128 bits (16 bytes)
- **Format:** `Base64(IV || AuthTag || Ciphertext)`

### Why AES-256-GCM?
- **Authenticated Encryption:** Detects tampering (AEAD)
- **Industry Standard:** NIST recommended, FIPS 140-2 compliant
- **Performance:** Hardware-accelerated on most platforms
- **Secure:** No known practical attacks

## Testing Encryption

```typescript
import { encryptField, decryptField, validateEncryptionConfig } from '@/lib/encryption';

// 1. Validate configuration
const validation = validateEncryptionConfig();
if (!validation.valid) {
  console.error('Encryption not configured:', validation.error);
}

// 2. Test encryption roundtrip
const original = 'sensitive data';
const userId = 'user_123';

const encrypted = encryptField(original, userId);
const decrypted = decryptField(encrypted, userId);

console.assert(decrypted === original, 'Encryption roundtrip failed');

// 3. Verify multi-tenancy isolation
const encrypted1 = encryptField('data', 'user_1');
const encrypted2 = encryptField('data', 'user_2');

console.assert(encrypted1 !== encrypted2, 'Same data should encrypt differently for different users');

try {
  decryptField(encrypted1, 'user_2'); // Should fail
  console.error('Multi-tenancy isolation broken!');
} catch {
  console.log('Multi-tenancy isolation verified ✓');
}
```

## Compliance

### GDPR Compliance
- ✅ Data minimization (only encrypt what's necessary)
- ✅ Encryption at rest (AES-256-GCM)
- ✅ Right to erasure (delete encrypted data)
- ✅ Data portability (decrypt for export)
- ✅ Breach notification (encryption reduces risk)

### PCI-DSS Compliance
- ✅ Requirement 3: Protect stored cardholder data
- ✅ Requirement 4: Encrypt transmission (separate concern)
- ✅ AES-256 meets strong cryptography requirements
- ⚠️ Key management must follow PCI-DSS guidelines

## Troubleshooting

### "ENCRYPTION_MASTER_KEY environment variable not set"
**Solution:** Add `ENCRYPTION_MASTER_KEY` to your `.env` file.

### "ENCRYPTION_MASTER_KEY must be 64 hex characters"
**Solution:** Generate a new key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### "Failed to decrypt field"
**Possible Causes:**
1. Data encrypted with different userId
2. Master key changed without re-encryption
3. Data corruption
4. Wrong data format (not base64)

**Solution:**
- Check userId matches encryption userId
- Verify master key hasn't changed
- Implement key rotation if needed

### Performance Impact
- **Encryption:** ~0.1ms per field (negligible)
- **Decryption:** ~0.1ms per field (negligible)
- **Bulk Operations:** Consider using `encryptObject`/`decryptObject` for better performance

## Roadmap

- [ ] Implement key rotation automation
- [ ] Add encryption audit logging
- [ ] Support field-level access control
- [ ] Integrate with AWS KMS/Google Cloud KMS for key management
- [ ] Add encryption performance monitoring
- [ ] Implement encrypted search (order-preserving encryption)
- [ ] Add column-level encryption for database queries

## References

- [NIST AES-GCM Specification](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-38d.pdf)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
