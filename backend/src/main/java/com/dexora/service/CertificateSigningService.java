package com.dexora.service;

import com.dexora.entity.CertificateSigningKey;
import com.dexora.repository.CertificateSigningKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class CertificateSigningService {

    public static final String PRIMARY_KEY_ID = "tunisign-ecdsa-p256-v1";
    public static final String SIGNATURE_ALGORITHM = "SHA256withECDSA";

    private final CertificateSigningKeyRepository signingKeyRepository;

    @Transactional
    public String sign(String payload) {
        try {
            CertificateSigningKey key = getOrCreatePrimaryKey();
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            Signature signature = Signature.getInstance(SIGNATURE_ALGORITHM);
            signature.initSign(keyFactory.generatePrivate(new PKCS8EncodedKeySpec(decode(key.getPrivateKeyBase64()))));
            signature.update(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature.sign());
        } catch (Exception exception) {
            throw new IllegalStateException("Impossible de signer le certificat", exception);
        }
    }

    @Transactional(readOnly = true)
    public boolean verify(String keyId, String payload, String encodedSignature) {
        try {
            CertificateSigningKey key = signingKeyRepository.findById(keyId).orElse(null);
            if (key == null) return false;
            KeyFactory keyFactory = KeyFactory.getInstance("EC");
            Signature signature = Signature.getInstance(SIGNATURE_ALGORITHM);
            signature.initVerify(keyFactory.generatePublic(new X509EncodedKeySpec(decode(key.getPublicKeyBase64()))));
            signature.update(payload.getBytes(StandardCharsets.UTF_8));
            return signature.verify(Base64.getUrlDecoder().decode(encodedSignature));
        } catch (Exception exception) {
            return false;
        }
    }

    @Transactional
    public String primaryPublicKeyFingerprint() {
        try {
            byte[] publicKey = decode(getOrCreatePrimaryKey().getPublicKeyBase64());
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(publicKey);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception exception) {
            throw new IllegalStateException("Impossible de calculer l'empreinte de la clé", exception);
        }
    }

    private CertificateSigningKey getOrCreatePrimaryKey() {
        return signingKeyRepository.findById(PRIMARY_KEY_ID).orElseGet(() -> {
            try {
                KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
                generator.initialize(new ECGenParameterSpec("secp256r1"));
                KeyPair pair = generator.generateKeyPair();
                CertificateSigningKey key = new CertificateSigningKey();
                key.setId(PRIMARY_KEY_ID);
                key.setAlgorithm(SIGNATURE_ALGORITHM);
                key.setPrivateKeyBase64(Base64.getEncoder().encodeToString(pair.getPrivate().getEncoded()));
                key.setPublicKeyBase64(Base64.getEncoder().encodeToString(pair.getPublic().getEncoded()));
                key.setCreatedAt(Instant.now());
                return signingKeyRepository.save(key);
            } catch (Exception exception) {
                throw new IllegalStateException("Impossible de créer la clé de signature", exception);
            }
        });
    }

    private byte[] decode(String value) {
        return Base64.getDecoder().decode(value);
    }
}
