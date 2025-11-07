export function formatItalianDate(datetimeString) {
    if (!datetimeString) return '';
  
    const date = new Date(datetimeString);
  
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Rome',
    });
  }