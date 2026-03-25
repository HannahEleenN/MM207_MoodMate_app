import express from 'express';
import { authorizeUserIdentity } from '../middleware/privacy_guard.mjs';
import { HTTP } from '../utils/http_constants.mjs';
import Mood from '../models/mood_server_model.mjs';

// -------------------------------------------------------------------------------------------------------------------

const router = express.Router();

const supported_formats = ['csv', 'json', 'xml'];

// -------------------------------------------------------------------------------------------------------------------

function escape_CSV_fields(field)
{
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n'))
    {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// ---------------------------------------------------------------------------------------------------------------------

function escape_XML_special_characters(str)
{
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function convert_mood_data_to_CSV(moods)
{
    const headers = ['Mood', 'Context', 'Solution', 'Note', 'Timestamp'];
    const rows = [headers.map(h => escape_CSV_fields(h)).join(',')];

    moods.forEach(mood => 
    {
        const row = [
            escape_CSV_fields(mood.mood),
            escape_CSV_fields(mood.context),
            escape_CSV_fields(mood.solution),
            escape_CSV_fields(mood.note),
            escape_CSV_fields(mood.timestamp ? new Date(mood.timestamp).toISOString() : '')
        ];
        rows.push(row.join(','));
    });

    return rows.join('\n');
}

function convert_mood_data_to_JSON(moods)
{
    return JSON.stringify({
        exportDate: new Date().toISOString(),
        format: 'json',
        moodCount: moods.length,
        moods: moods.map(mood => ({
            mood: mood.mood,
            context: mood.context,
            solution: mood.solution || null,
            note: mood.note || null,
            timestamp: mood.timestamp ? new Date(mood.timestamp).toISOString() : null
        }))
    }, null, 2);
}

function convert_mood_data_to_XML(moods)
{
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<moodmate>\n';
    xml += `  <exportDate>${new Date().toISOString()}</exportDate>\n`;
    xml += `  <moodCount>${moods.length}</moodCount>\n`;
    xml += '  <moods>\n';

    moods.forEach((mood, index) => {
        xml += `    <mood id="${index + 1}">\n`;
        xml += `      <emotion>${escape_XML_special_characters(mood.mood)}</emotion>\n`;
        xml += `      <context>${escape_XML_special_characters(mood.context)}</context>\n`;
        if (mood.solution) xml += `      <solution>${escape_XML_special_characters(mood.solution)}</solution>\n`;
        if (mood.note) xml += `      <note>${escape_XML_special_characters(mood.note)}</note>\n`;
        xml += `      <timestamp>${mood.timestamp ? new Date(mood.timestamp).toISOString() : ''}</timestamp>\n`;
        xml += '    </mood>\n';
    });

    xml += '  </moods>\n';
    xml += '</moodmate>';
    return xml;
}

// -------------------------------------------------------------------------------------------------------------------

router.get('/:format', authorizeUserIdentity, async (req, res, next) =>
{
    try
    {
        const format = req.params.format.toLowerCase();
        
        if (!supported_formats.includes(format))
        {
            return res.status(HTTP.BAD_REQUEST).json({ 
                error: `Unsupported format: ${format}. Supported formats: ${supported_formats.join(', ')}`
            });
        }

        const userId = req.user && (req.user.userId || req.user.id);
        if (!userId)
        {
            return res.status(HTTP.UNAUTHORIZED).json({ error: 'Unauthorized' });
        }
        
        let moods;
        try
        {
            moods = Mood && Mood.findByUser ? await Mood.findByUser(userId) : [];
        }
        catch (dbErr)
        {
            console.error('Database error fetching moods for export:', dbErr);
            moods = [];
        }
        
        switch (format)
        {
            case 'csv':
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="moodmate_export.csv"');
                return res.send(convert_mood_data_to_CSV(moods));
            
            case 'json':
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="moodmate_export.json"');
                return res.send(convert_mood_data_to_JSON(moods));
            
            case 'xml':
                res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="moodmate_export.xml"');
                return res.send(convert_mood_data_to_XML(moods));
            
            default:
                return res.status(HTTP.BAD_REQUEST).json({ error: 'Invalid format' });
        }
    }
    catch (err)
    {
        console.error('Export error:', err);
        return next(err);
    }
});

// -------------------------------------------------------------------------------------------------------------------

export default router;
