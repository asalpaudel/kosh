package com.kosh.backend.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.kosh.backend.model.Network;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    private final Map<String, String> otpStorage = new HashMap<>();

    public void sendOtpEmail(String toEmail, String name, String otp, Network network) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom("your-email@gmail.com"); 
        helper.setTo(toEmail);
        helper.setSubject("Password Reset Request");

        String sahakariName = (network != null) ? network.getName() : "Kosh Cooperative";
        
        String logoHtml = "";
        if (network != null && network.getLogoData() != null) {
            logoHtml = "<img src='cid:sahakariLogo' alt='Sahakari Logo' style='max-height: 80px; width: auto;' />";
        }

        String htmlContent = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    %s
                    <h2 style="color: #00897b; margin-top: 10px;">%s</h2>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <div style="padding: 20px 0;">
                    <p style="font-size: 16px; color: #333;">Hello <strong>%s</strong>,</p>
                    <p style="font-size: 16px; color: #555;">We received a request to reset your password. Use the code below to complete the process:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; background: #e0f2f1; padding: 10px 20px; border-radius: 5px; border: 1px dashed #00897b;">
                            %s
                        </span>
                    </div>
                    
                    <p style="font-size: 14px; color: #777;">This code is valid for <strong>5 minutes</strong>. If you didn't request this, please ignore this email.</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee;" />
                <div style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
                    <p>&copy; 2025 Kosh Cooperative Management System</p>
                </div>
            </div>
        """.formatted(logoHtml, sahakariName, name, otp);

        helper.setText(htmlContent, true); // true = HTML

        if (network != null && network.getLogoData() != null) {
            String contentType = network.getLogoType();
            
            if (contentType == null || contentType.isEmpty()) {
                contentType = "image/png"; 
            }
            
            helper.addInline("sahakariLogo", new ByteArrayResource(network.getLogoData()), contentType);
        }

        mailSender.send(message);
    }

    public String generateOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email, otp);
        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        if (!otpStorage.containsKey(email)) return false;
        return otpStorage.get(email).equals(otp);
    }

    public void clearOtp(String email) {
        otpStorage.remove(email);
    }
}