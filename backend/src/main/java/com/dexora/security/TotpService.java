package com.dexora.security;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;

@Service
public class TotpService {
    private static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    public String createSecret() {
        byte[] bytes = new byte[20];
        new SecureRandom().nextBytes(bytes);
        StringBuilder output = new StringBuilder();
        int buffer = 0, bits = 0;
        for (byte value : bytes) {
            buffer = (buffer << 8) | (value & 255); bits += 8;
            while (bits >= 5) { output.append(ALPHABET.charAt((buffer >> (bits - 5)) & 31)); bits -= 5; }
        }
        if (bits > 0) output.append(ALPHABET.charAt((buffer << (5 - bits)) & 31));
        return output.toString();
    }

    public boolean isValid(String secret, String code) {
        if (code == null || !code.matches("\\d{6}")) return false;
        long step = System.currentTimeMillis() / 30_000L;
        for (long offset = -1; offset <= 1; offset++) if (code.equals(String.format("%06d", codeFor(secret, step + offset)))) return true;
        return false;
    }

    public String otpAuthUri(String email, String secret) {
        String label = URLEncoder.encode("TuniSign:" + email, StandardCharsets.UTF_8);
        return "otpauth://totp/" + label + "?secret=" + secret + "&issuer=TuniSign&algorithm=SHA1&digits=6&period=30";
    }

    private int codeFor(String secret, long step) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(decode(secret), "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());
            int offset = hash[hash.length - 1] & 15;
            int binary = ((hash[offset] & 127) << 24) | ((hash[offset + 1] & 255) << 16) | ((hash[offset + 2] & 255) << 8) | (hash[offset + 3] & 255);
            return binary % 1_000_000;
        } catch (Exception ex) { throw new IllegalStateException("Unable to generate TOTP", ex); }
    }

    private byte[] decode(String value) {
        ByteBuffer output = ByteBuffer.allocate(value.length() * 5 / 8); int buffer = 0, bits = 0;
        for (char c : value.toCharArray()) { int index = ALPHABET.indexOf(c); if (index < 0) throw new IllegalArgumentException("Invalid TOTP secret"); buffer = (buffer << 5) | index; bits += 5; if (bits >= 8) { output.put((byte) (buffer >> (bits - 8))); bits -= 8; } }
        byte[] result = new byte[output.position()]; output.rewind(); output.get(result); return result;
    }
}
