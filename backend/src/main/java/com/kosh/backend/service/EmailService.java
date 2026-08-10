package com.kosh.backend.service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.kosh.backend.model.Network;
import com.kosh.backend.model.Transaction;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String senderEmail;

    private final Map<String, String> otpStorage = new HashMap<>();

    /**
     * Sends a specifically formatted OTP email for Password Resets.
     */
    public void sendOtpEmail(String toEmail, String name, String otp, Network network) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(senderEmail);
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

    /**
     * ⭐ NEW METHOD: Generic email sender used by AuthController for 2FA.
     */
    public void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            
            helper.setFrom(senderEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            
            // Set to false because AuthController sends plain text with \n
            helper.setText(body, false); 

            mailSender.send(message);
        } catch (MessagingException e) {
            // Log the error but don't crash the application flow
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
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

    /**
     * Sends an HTML voucher-styled email for a transaction, matching the frontend voucher layout.
     */
    public void sendTransactionVoucherEmail(String toEmail, Transaction tx, Network network) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject("Transaction Voucher - " + (tx.getVoucherId() != null ? tx.getVoucherId() : "TXN#" + tx.getId()));

            String sahakariName = (network != null) ? network.getName() : "Kosh Cooperative";
            String sahakariAddress = (network != null && network.getAddress() != null) ? network.getAddress() : "Nepal";
            String panNumber = (network != null && network.getPanNumber() != null) ? " | PAN No: " + network.getPanNumber() : "";

            // Logo
            String logoHtml = "";
            if (network != null && network.getLogoData() != null) {
                logoHtml = "<img src='cid:sahakariLogo' alt='Logo' style='width: 48px; height: 48px; object-fit: contain;' />";
            }

            // Amount formatting
            double amount = tx.getAmount() != null ? tx.getAmount() : 0.0;
            String formattedAmount = String.format("Rs. %,.2f", amount);
            boolean isCredit = "Credit".equalsIgnoreCase(tx.getDirection());
            String amountColor = isCredit ? "#16a34a" : "#dc2626";
            String amountPrefix = isCredit ? "+" : "-";

            // Payment method section
            String paymentSection = "";
            if (tx.getPaymentMethod() != null && !tx.getPaymentMethod().isEmpty()) {
                StringBuilder sb = new StringBuilder();
                sb.append("<tr><td colspan='2' style='padding: 12px 16px 0;'>");
                sb.append("<table width='100%' cellpadding='0' cellspacing='0' style='border-top: 1px solid #e5e7eb; padding-top: 12px;'><tr>");
                sb.append("<td style='padding: 4px 8px;'><span style='display: block; font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold;'>Method</span>");
                sb.append("<span style='font-weight: 500;'>").append(tx.getPaymentMethod()).append("</span></td>");
                
                if (!"Cash".equals(tx.getPaymentMethod())) {
                    sb.append("<td style='padding: 4px 8px;'><span style='display: block; font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold;'>Cheque No</span>");
                    sb.append("<span style='font-family: monospace; font-weight: 500;'>").append(tx.getChequeNo() != null ? tx.getChequeNo() : "-").append("</span></td>");
                    sb.append("<td style='padding: 4px 8px;'><span style='display: block; font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold;'>Bank</span>");
                    sb.append("<span style='font-weight: 500;'>").append(tx.getBankName() != null ? tx.getBankName() : "-").append("</span></td>");
                }

                sb.append("</tr></table></td></tr>");
                paymentSection = sb.toString();
            }

            String htmlContent = """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin: 0; padding: 20px; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
            <table width="600" cellpadding="0" cellspacing="0" align="center" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
              
              <!-- Header -->
              <tr>
                <td style="padding: 24px 32px; border-bottom: 2px solid #1f2937;">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align: middle;">
                        <table cellpadding="0" cellspacing="0"><tr>
                          <td style="vertical-align: middle; padding-right: 12px;">%s</td>
                          <td style="vertical-align: middle;">
                            <div style="font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #1f2937;">%s</div>
                            <div style="font-size: 11px; color: #6b7280;">%s%s</div>
                          </td>
                        </tr></table>
                      </td>
                      <td style="text-align: right; vertical-align: middle;">
                        <div style="font-size: 16px; font-weight: bold; color: #374151;">TRANSACTION VOUCHER</div>
                        <div style="font-size: 13px; font-family: monospace; color: #6b7280;">#%s</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Date & Txn ID -->
              <tr>
                <td style="padding: 16px 32px;">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold;">Transaction Date</div>
                        <div style="font-size: 16px; font-weight: 500; color: #1f2937;">%s</div>
                      </td>
                      <td style="text-align: right;">
                        <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold;">System Txn ID</div>
                        <div style="font-family: monospace; color: #1f2937;">%s</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Account Details Box -->
              <tr>
                <td style="padding: 0 32px;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px;">
                    <tr>
                      <td style="padding: 16px;">
                        <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Account / User</div>
                        <div style="font-size: 18px; font-weight: bold; color: #111827;">%s</div>
                        %s
                      </td>
                      <td style="padding: 16px; text-align: right;">
                        <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 4px;">Transaction Type</div>
                        <div style="font-size: 14px; font-weight: 600; color: #374151;">%s</div>
                      </td>
                    </tr>
                    %s
                  </table>
                </td>
              </tr>

              <!-- Amount -->
              <tr>
                <td style="padding: 20px 32px;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 16px 0;">
                    <tr>
                      <td style="padding: 16px 0; font-size: 14px; color: #4b5563; font-weight: 500;">Total Amount</td>
                      <td style="padding: 16px 0; text-align: right; font-size: 28px; font-weight: bold; color: %s;">%s %s</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Narration -->
              <tr>
                <td style="padding: 0 32px 20px;">
                  <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">Narration / Remarks</div>
                  <div style="color: #374151; font-style: italic; background: #f9fafb; padding: 12px; border-radius: 6px; border: 1px solid #f3f4f6; min-height: 40px; font-size: 14px;">
                    %s
                  </div>
                </td>
              </tr>

              <!-- Status -->
              <tr>
                <td style="padding: 0 32px 24px;">
                  <div style="font-size: 10px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 6px;">Status</div>
                  <span style="display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;">%s</span>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 16px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <div style="font-size: 11px; color: #9ca3af;">&copy; 2025 Kosh Cooperative Management System</div>
                  <div style="font-size: 10px; color: #d1d5db; margin-top: 4px;">This is a system-generated email. Please do not reply.</div>
                </td>
              </tr>

            </table>
            </body>
            </html>
            """.formatted(
                logoHtml,
                sahakariName,
                sahakariAddress,
                panNumber,
                tx.getVoucherId() != null ? tx.getVoucherId() : "N/A",
                tx.getDate() != null ? tx.getDate().toString() : "-",
                tx.getId() != null ? tx.getId().toString() : "-",
                tx.getUserName() != null ? tx.getUserName() : "-",
                tx.getAccountHead() != null ? "<div style='font-size: 13px; color: #6b7280;'>Head: " + tx.getAccountHead() + "</div>" : "",
                tx.getType() != null ? tx.getType() : "-",
                paymentSection,
                amountColor,
                amountPrefix,
                formattedAmount,
                tx.getNarration() != null ? tx.getNarration() : "No additional remarks provided.",
                tx.getStatus() != null ? tx.getStatus() : "Success"
            );

            helper.setText(htmlContent, true);

            // Attach logo inline
            if (network != null && network.getLogoData() != null) {
                String contentType = network.getLogoType();
                if (contentType == null || contentType.isEmpty()) {
                    contentType = "image/png";
                }
                helper.addInline("sahakariLogo", new ByteArrayResource(network.getLogoData()), contentType);
            }

            mailSender.send(message);
            System.out.println("✅ Transaction voucher email sent to " + toEmail);

        } catch (Exception e) {
            System.err.println("⚠️ Failed to send transaction voucher email to " + toEmail + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
