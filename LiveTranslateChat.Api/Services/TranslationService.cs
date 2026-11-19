
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using System.Collections.Generic;

namespace LiveTranslateChat.Services;

public class TranslationService
{
    private readonly HttpClient _httpClient;

    public TranslationService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    private static readonly Regex EmojiRegex = new(
    @"(?:[\uD83C-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])(?:\uFE0F|\uFE0E)?",
    RegexOptions.Compiled
);

    public async Task<string> TranslateAsync(string text, string targetLanguage)
    {
        var matches = EmojiRegex.Matches(text);
        var result = new System.Text.StringBuilder();

        int lastPosition = 0;

        foreach (Match match in matches)
        {
            // Récupérer le texte avant l'emoji
            string textPart = text.Substring(
                lastPosition,
                match.Index - lastPosition
            );

            // Traduire uniquement le texte
            if (!string.IsNullOrWhiteSpace(textPart))
            {
                result.Append(
                    await TranslateTextPartAsync(textPart, targetLanguage)
                );
            }
            else
            {
                result.Append(textPart);
            }

            // Remettre l'emoji sans le transmettre au traducteur
            result.Append(match.Value);

            lastPosition = match.Index + match.Length;
        }

        // Traduire le texte restant après le dernier emoji
        string remainingText = text.Substring(lastPosition);

        if (!string.IsNullOrWhiteSpace(remainingText))
        {
            result.Append(
                await TranslateTextPartAsync(remainingText, targetLanguage)
            );
        }
        else
        {
            result.Append(remainingText);
        }

        // Aucun emoji : le texte entier est traduit normalement.
        if (matches.Count == 0)
        {
            return await TranslateTextPartAsync(text, targetLanguage);
        }

        return result.ToString();
    }

    private async Task<string> TranslateTextPartAsync(
        string text,
        string targetLanguage)
    {
        var request = new
        {
            q = text,
            source = "auto",
            target = targetLanguage,
            format = "text"
        };

        var response = await _httpClient.PostAsJsonAsync("/translate", request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception(
                $"Erreur LibreTranslate : {(int)response.StatusCode} - {responseBody}"
            );
        }

        var translation = await response.Content.ReadFromJsonAsync<TranslationResponse>();

        return translation?.TranslatedText
            ?? throw new InvalidOperationException(
                "LibreTranslate n'a renvoyé aucune traduction."
            );
    }




    private sealed class TranslationResponse
    {
        public string? TranslatedText { get; set; }
    }
}
