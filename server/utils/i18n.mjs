import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const translationsDir = path.join(__dirname, '..', '..', 'client', 'translations');

// ---------------------------------------------------------------------------------------------------------------------

const FALLBACK =
{
    en:
    {
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
    nb:
    {
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
    sv:
    {
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
    },
    es:
    {
        errorCodes: {
            IncorrectId: 'Usuario no encontrado.',
            Unauthorized: 'Sin acceso: inicia sesión de nuevo.',
            NotFound: 'Lo sentimos, la página que buscas no fue encontrada.'
        },
        info: {
            MasterUserFound: 'Usuario maestro encontrado',
            Hello: '¡Hola! 🌟',
            UserCreated: 'Usuario creado. Ya puedes iniciar sesión.',
            MoodSaved: '¡Ánimo guardado!',
            MoodsFetched: 'Entradas de estado de ánimo recuperadas.'
        }
    },
    da:
    {
        errorCodes: {
            IncorrectId: 'Bruger blev ikke fundet.',
            Unauthorized: 'Ingen adgang: log ind igen.',
            NotFound: 'Siden blev ikke fundet.'
        },
        info: {
            MasterUserFound: 'Master-bruger fundet',
            Hello: 'Hej! 🌟',
            UserCreated: 'Bruger oprettet. Du kan nu logge ind.',
            MoodSaved: 'Humør gemt!',
            MoodsFetched: 'Hentede humørposter.'
        }
    }
};

// ---------------------------------------------------------------------------------------------------------------------

const SERVER_TO_CLIENT_KEY =
{
    'errorCodes.IncorrectId': 'user.notFound',
    'errorCodes.Unauthorized': 'auth.no_token',
    'errorCodes.NotFound': 'notfound.message',

    'info.MasterUserFound': null,
    'info.Hello': 'child.hello',
    'info.UserCreated': 'register.success',
    'info.MoodSaved': 'mood.saved',
    'info.MoodsFetched': null
};

// ---------------------------------------------------------------------------------------------------------------------

function camelToDot(name)
{
    return name.replace(/([A-Z])/g, (m, p, offset) => (offset ? '.' : '') + p.toLowerCase());
}

// ---------------------------------------------------------------------------------------------------------------------

function resolveClientKeyForServerPath(serverPath, json)
{
    const explicit = SERVER_TO_CLIENT_KEY[serverPath];
    if (explicit) return explicit;

    if (serverPath.startsWith('info.'))
    {
        const name = serverPath.split('.')[1];
        const candidate = camelToDot(name);
        if (json && candidate in json) return candidate;
        const alt = candidate.replace(/^moods?\./, 'mood.');
        if (json && alt in json) return alt;
    }

    return null;
}

// ---------------------------------------------------------------------------------------------------------------------

function readClientJson(code)
{
    try {
        const translationFilePath = path.join(translationsDir, `${code}.json`);
        const raw = fs.readFileSync(translationFilePath, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

// ---------------------------------------------------------------------------------------------------------------------

function lookupClientKey(jsonData, clientKey)
{
    if (!jsonData || !clientKey) return null;

    if (Object.prototype.hasOwnProperty.call(jsonData, clientKey)) return jsonData[clientKey];

    const keyParts = clientKey.split('.');
    let currentObject = jsonData;
    for (const keyPart of keyParts)
    {
        if (currentObject && typeof currentObject === 'object' && Object.prototype.hasOwnProperty.call(currentObject, keyPart))
        {
            currentObject = currentObject[keyPart];
        } else {
            currentObject = null;
            break;
        }
    }
    return currentObject;
}

// ---------------------------------------------------------------------------------------------------------------------

const knownCodes = (() =>
{
    try {
        const files = fs.readdirSync(translationsDir);
        return files.filter(fileName => fileName.endsWith('.json')).map(fileName => path.basename(fileName, '.json'));
    } catch (e) {
        return ['en', 'nb', 'sv'];
    }
})();

// ---------------------------------------------------------------------------------------------------------------------

export const I18n = {};
for (const languageCode of knownCodes)
{
    const clientJsonData = readClientJson(languageCode);
    const fallbackLanguageData = FALLBACK[languageCode] || FALLBACK['en'];
    const translationObject = { errorCodes: {}, info: {} };

    for (const serverPath of Object.keys(SERVER_TO_CLIENT_KEY))
    {
        const clientKey = resolveClientKeyForServerPath(serverPath, clientJsonData);
        const pathParts = serverPath.split('.');
        const namespace = pathParts[0];
        const name = pathParts[1];

        let value = null;
        let usedClient = false;
        if (clientKey)
        {
            const found = lookupClientKey(clientJsonData, clientKey);
            if (found !== null && typeof found !== 'undefined')
            {
                value = found;
                usedClient = true;
            }
        }

        if (!value) value = (fallbackLanguageData && fallbackLanguageData[namespace] && fallbackLanguageData[namespace][name]) ? fallbackLanguageData[namespace][name] : null;
        if (!value && FALLBACK['en'] && FALLBACK['en'][namespace]) value = FALLBACK['en'][namespace][name] || null;

        try
        {
            const warn = process && process.env && process.env.I18N_WARN === '1';
            if (warn && !usedClient) {
                console.warn(`[i18n] fallback used for ${languageCode}/${serverPath} (no client translation found)`);
            }
        } catch (error) {}

        translationObject[namespace][name] = value;
    }

    I18n[languageCode] = translationObject;
}

// ---------------------------------------------------------------------------------------------------------------------

export function pickLanguage(acceptLanguageHeader)
{
    if (!acceptLanguageHeader || typeof acceptLanguageHeader !== 'string') return 'en';

    const parts = acceptLanguageHeader.split(',').map(languagePart => languagePart.trim());
    for (const part of parts)
    {
        const lang = part.split(';')[0].toLowerCase();
        const primary = lang.split('-')[0];
        if (I18n[primary]) return primary;
    }
    return 'en';
}