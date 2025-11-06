using System.Text;
using System.Text.Json;

namespace Career_Management.Server.Services
{
    public interface IEmailService
    {
        Task<bool> SendVerificationCodeAsync(string toEmail, string recipientName, string verificationCode);
        Task<bool> SendPasswordResetConfirmationAsync(string toEmail, string recipientName);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly HttpClient _httpClient;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger, HttpClient httpClient)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClient;
        }

        public async Task<bool> SendVerificationCodeAsync(string toEmail, string recipientName, string verificationCode)
        {
            try
            {
                _logger.LogInformation($"Starting to send verification code to {toEmail}");

                // Load email configuration
                var emailConfig = await LoadEmailConfigurationAsync("password-reset-verification-config.json");
                if (emailConfig == null)
                {
                    _logger.LogError("Failed to load email configuration for verification code");
                    return false;
                }

                // Prepare email body with placeholders replaced
                var body = emailConfig.Body
                    .Replace("[Recipient Name]", recipientName)
                    .Replace("[Verification Code]", verificationCode);

                // Send email via API
                return await SendEmailViaApiAsync(toEmail, emailConfig.Subject, body, emailConfig.IsHTML, emailConfig.Token, emailConfig.FromAlias);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending verification code email to {Email}", toEmail);
                return false;
            }
        }

        public async Task<bool> SendPasswordResetConfirmationAsync(string toEmail, string recipientName)
        {
            try
            {
                _logger.LogInformation($"Starting to send password reset confirmation to {toEmail}");

                // Load email configuration
                var emailConfig = await LoadEmailConfigurationAsync("password-reset-confirmation-config.json");
                if (emailConfig == null)
                {
                    _logger.LogError("Failed to load email configuration for password reset confirmation");
                    return false;
                }

                // Prepare email body with placeholders replaced
                var body = emailConfig.Body.Replace("[Recipient Name]", recipientName);

                // Send email via API
                return await SendEmailViaApiAsync(toEmail, emailConfig.Subject, body, emailConfig.IsHTML, emailConfig.Token, emailConfig.FromAlias);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending password reset confirmation to {Email}", toEmail);
                return false;
            }
        }

        private async Task<PasswordResetEmailConfiguration?> LoadEmailConfigurationAsync(string configFileName)
        {
            try
            {
                // Load token configuration (shared across all emails)
                var tokenConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "Config", "send-email-token.json");
                var emailConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "Config", configFileName);

                _logger.LogInformation($"Token config path: {tokenConfigPath}");
                _logger.LogInformation($"Email config path: {emailConfigPath}");

                if (!File.Exists(tokenConfigPath))
                {
                    _logger.LogError($"Token config file not found at: {tokenConfigPath}");
                    return null;
                }

                if (!File.Exists(emailConfigPath))
                {
                    _logger.LogError($"Email config file not found at: {emailConfigPath}");
                    return null;
                }

                var tokenConfigJson = await File.ReadAllTextAsync(tokenConfigPath);
                var emailConfigJson = await File.ReadAllTextAsync(emailConfigPath);

                _logger.LogInformation("Configuration files read successfully");

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip
                };

                var tokenConfig = JsonSerializer.Deserialize<EmailTokenConfig>(tokenConfigJson, options);
                var emailConfig = JsonSerializer.Deserialize<PasswordResetConfig>(emailConfigJson, options);

                if (tokenConfig?.EmailConfig == null)
                {
                    _logger.LogError("Token config is null or EmailConfig is null");
                    return null;
                }

                if (emailConfig?.EmailConfig == null)
                {
                    _logger.LogError("Email config is null or EmailConfig is null");
                    return null;
                }

                var config = new PasswordResetEmailConfiguration
                {
                    Token = tokenConfig.EmailConfig.Token,
                    FromAlias = tokenConfig.EmailConfig.FromAlias,
                    Subject = emailConfig.EmailConfig.Subject,
                    Body = emailConfig.EmailConfig.Body,
                    IsHTML = emailConfig.EmailConfig.IsHTML
                };

                _logger.LogInformation("Email configuration loaded successfully");
                return config;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error loading email configuration: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return null;
            }
        }

        private async Task<bool> SendEmailViaApiAsync(string toEmail, string subject, string body, bool isHTML, string token, string fromAlias)
        {
            try
            {
                // Prepare email data
                var emailData = new
                {
                    To = toEmail,
                    Cc = "",
                    Bcc = "",
                    Subject = subject,
                    Body = body,
                    IsHTML = isHTML,
                    token = token,
                    FromAlias = fromAlias
                };

                _logger.LogInformation($"Prepared email data for {toEmail}");

                // Send email via API
                var json = JsonSerializer.Serialize(emailData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Sending request to email service API...");
                var response = await _httpClient.PostAsync("https://altsmart.alliancels.net/api/SendMail", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Email sent successfully to {toEmail}");
                    return true;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to send email. Status: {response.StatusCode}, Error: {errorContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending email via API: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return false;
            }
        }
    }

    // Configuration classes for password reset emails
    public class PasswordResetEmailConfiguration
    {
        public string Token { get; set; } = string.Empty;
        public string FromAlias { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsHTML { get; set; }
    }

    public class PasswordResetConfig
    {
        public PasswordResetConfigData? EmailConfig { get; set; }
    }

    public class PasswordResetConfigData
    {
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsHTML { get; set; }
    }
}

