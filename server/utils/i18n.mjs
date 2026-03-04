// Lightweight i18n helper and message catalog
export const I18n =
{
    en: {
        errorCodes: {
            IncorrectId: 'Missing or incorrect id',
            Unauthorized: 'You are not authorized to access this resource',
            NotFound: 'Resource not found'
        },
        info: {
            MasterUserFound: 'Master user found',
            Hello: 'Hello',
            UserCreated: 'User created. You can now sign in.',
            MoodSaved: 'Mood saved!',
            MoodsFetched: 'Fetched mood entries.'
        }
    },
    nb: {
        errorCodes: {
            IncorrectId: 'Mangler eller ugyldig id',
            Unauthorized: 'Du har ikke tilgang til denne ressursen',
            NotFound: 'Ressursen ble ikke funnet'
        },
        info: {
            MasterUserFound: 'Master-bruker funnet',
            Hello: 'Hei',
            UserCreated: 'Bruker opprettet. Du kan nå gå til innlogging.',
            MoodSaved: 'Humøret er lagret!',
            MoodsFetched: 'Hentet humørlogger.'
        }
    },
    sv: {
        errorCodes: {
            IncorrectId: 'Saknas eller felaktigt id',
            Unauthorized: 'Du har inte behörighet att komma åt denna resurs',
            NotFound: 'Resursen hittades inte'
        },
        info: {
            MasterUserFound: 'Master-användare hittad',
            Hello: 'Hej',
            UserCreated: 'Användare skapad. Du kan nu logga in.',
            MoodSaved: 'Humör sparat!',
            MoodsFetched: 'Hämtade humörposter.'
        }
    }
};

// Parse Accept-Language header and pick the best supported locale (fallback to 'en')
export function pickLocale(acceptLanguageHeader)
{
    if (!acceptLanguageHeader || typeof acceptLanguageHeader !== 'string') return 'en';

    // Example header: "nb,no;q=0.9,en;q=0.8"
    const parts = acceptLanguageHeader.split(',').map(p => p.trim());
    for (const part of parts) {
        const lang = part.split(';')[0].toLowerCase();
        // Accept language tags like "nb", "nb-NO", "en-US" -> match primary subtag
        const primary = lang.split('-')[0];
        if (I18n[primary]) return primary;
    }
    return 'en';
}
