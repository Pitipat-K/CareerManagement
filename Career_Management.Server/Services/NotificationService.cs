using System.Text.Json;
using System.Text;

namespace Career_Management.Server.Services
{
    public class NotificationService
    {
        private readonly ILogger<NotificationService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public NotificationService(ILogger<NotificationService> logger, IConfiguration configuration, HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<bool> SendAssessmentCompletionNotificationAsync(
            string employeeName,
            string managerEmail,
            string managerName,
            string positionTitle,
            string departmentName,
            string assessmentPeriod,
            DateTime completionDate,
            int totalCompetencies,
            double averageScore,
            int competenciesNeedingAttention)
        {
            try
            {
                _logger.LogInformation($"Starting to send notification to {managerEmail}");
                _logger.LogInformation($"Starting to send notification to {managerName}");

                // Load email configuration
                var emailConfig = await LoadEmailConfigurationAsync();
                if (emailConfig == null)
                {
                    _logger.LogError("Failed to load email configuration");
                    return false;
                }

                _logger.LogInformation("Email configuration loaded successfully");

                // Prepare email data
                var emailData = new
                {
                    To = managerEmail,
                    Cc = "",
                    Bcc = "",
                    Subject = emailConfig.Subject.Replace("[Employee Name]", employeeName),
                    Body = PrepareEmailBody(emailConfig.Body, employeeName, managerName, positionTitle, departmentName, assessmentPeriod, completionDate, totalCompetencies, averageScore, competenciesNeedingAttention),
                    IsHTML = emailConfig.IsHTML,
                    token = emailConfig.Token,
                    FromAlias = emailConfig.FromAlias
                };

                _logger.LogInformation($"Prepared email data for {managerEmail}");

                // Send email
                var json = JsonSerializer.Serialize(emailData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("Sending request to email service...");
                var response = await _httpClient.PostAsync("https://altsmart.alliancels.net/api/SendMail", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Assessment completion notification sent successfully to {managerEmail}");
                    return true;
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Failed to send notification. Status: {response.StatusCode}, Error: {errorContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending assessment completion notification: {ex.Message}");
                _logger.LogError($"Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        private async Task<EmailConfiguration?> LoadEmailConfigurationAsync()
        {
            try
            {
                // Load token configuration
                var tokenConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "Config", "send-email-token.json");
                var notificationConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "Config", "assessment-notification-config.json");

                _logger.LogInformation($"Token config path: {tokenConfigPath}");
                _logger.LogInformation($"Notification config path: {notificationConfigPath}");

                if (!File.Exists(tokenConfigPath))
                {
                    _logger.LogError($"Token config file not found at: {tokenConfigPath}");
                    return null;
                }

                if (!File.Exists(notificationConfigPath))
                {
                    _logger.LogError($"Notification config file not found at: {notificationConfigPath}");
                    return null;
                }

                var tokenConfigJson = await File.ReadAllTextAsync(tokenConfigPath);
                var notificationConfigJson = await File.ReadAllTextAsync(notificationConfigPath);

                _logger.LogInformation("Configuration files read successfully");
                _logger.LogInformation($"Token config JSON: {tokenConfigJson}");
                _logger.LogInformation($"Notification config JSON: {notificationConfigJson}");

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    AllowTrailingCommas = true,
                    ReadCommentHandling = JsonCommentHandling.Skip
                };

                EmailTokenConfig? tokenConfig = null;
                NotificationConfig? notificationConfig = null;

                try
                {
                    tokenConfig = JsonSerializer.Deserialize<EmailTokenConfig>(tokenConfigJson, options);
                    _logger.LogInformation($"Token config deserialized: {tokenConfig != null}");
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error deserializing token config: {ex.Message}");
                }

                try
                {
                    notificationConfig = JsonSerializer.Deserialize<NotificationConfig>(notificationConfigJson, options);
                    _logger.LogInformation($"Notification config deserialized: {notificationConfig != null}");
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error deserializing notification config: {ex.Message}");
                }

                if (tokenConfig?.EmailConfig == null)
                {
                    _logger.LogError("Token config is null or EmailConfig is null");
                    _logger.LogError($"Token config object: {tokenConfig}");
                    return null;
                }

                if (notificationConfig?.EmailConfig == null)
                {
                    _logger.LogError("Notification config is null or EmailConfig is null");
                    _logger.LogError($"Notification config object: {notificationConfig}");
                    return null;
                }

                var config = new EmailConfiguration
                {
                    Token = tokenConfig.EmailConfig.Token,
                    FromAlias = tokenConfig.EmailConfig.FromAlias,
                    Subject = notificationConfig.EmailConfig.Subject,
                    Body = notificationConfig.EmailConfig.Body,
                    IsHTML = notificationConfig.EmailConfig.IsHTML
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

        private string PrepareEmailBody(string template, string employeeName, string managerName, string positionTitle, string departmentName, string assessmentPeriod, DateTime completionDate, int totalCompetencies, double averageScore, int competenciesNeedingAttention)
        {
            var dueDate = completionDate.AddDays(7); // Manager has 7 days to complete assessment

            return template
                .Replace("[Employee Name]", employeeName)
                .Replace("[Manager Name]", managerName)
                .Replace("[Position Title]", positionTitle)
                .Replace("[Department Name]", departmentName)
                .Replace("[Assessment Period]", assessmentPeriod)
                .Replace("[Completion Date]", completionDate.ToString("MMMM dd, yyyy"))
                .Replace("[Due Date]", dueDate.ToString("MMMM dd, yyyy"))
                .Replace("[Number]", totalCompetencies.ToString())
                .Replace("[Average Score]", averageScore.ToString("F1"))
                .Replace("[Count]", competenciesNeedingAttention.ToString())
                .Replace("[Assessment System Link]", "https://localhost:52930/employee-development/assessment") // Replace with actual URL
                .Replace("[Company Name]", "Alliance Laundry Thailand") // Replace with actual company name
                .Replace("[Unsubscribe URL]", "#")
                .Replace("[Help URL]", "#");
        }
    }

    public class EmailConfiguration
    {
        public string Token { get; set; } = string.Empty;
        public string FromAlias { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsHTML { get; set; }
    }

    public class EmailTokenConfig
    {
        public EmailTokenConfigData? EmailConfig { get; set; }
    }

    public class EmailTokenConfigData
    {
        public string Token { get; set; } = string.Empty;
        public string FromAlias { get; set; } = string.Empty;
    }

    public class NotificationConfig
    {
        public NotificationConfigData? EmailConfig { get; set; }
    }

    public class NotificationConfigData
    {
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsHTML { get; set; }
    }
} 