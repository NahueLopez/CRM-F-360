namespace CRMF360.Domain;

public static class DateTimeHelper
{
    public static DateTime? ToUtc(DateTime? dt) =>
        dt.HasValue ? DateTime.SpecifyKind(dt.Value, DateTimeKind.Utc) : null;
}
