const {google} = require('googleapis');
const dotenv = require('dotenv');
const ClientToSheetMap = require('./constants');
dotenv.config();

async function fetchDataFromClientSheet(client) {
    // console.log(ClientToSheetMap['HAUTE_DIGGITE_DOG'].submittedForRemovalSheet);
    const spreadSheet = ClientToSheetMap[client].submittedForRemovalSheet;
    try {
        const client = new google.auth.JWT(
            process.env.GOOGLE_API_CLIENT_EMAIL,
            null,
            process.env.GOOGLE_API_PRIVATE_KEY.replace(/\\n/g, '\n'),
            ['https://www.googleapis.com/auth/spreadsheets']
        );

        const data = undefined;
        client.authorize(async function (err) {
            if (err) {
                console.log("Error occurred", err)
            }
        });
        const gsapi = google.sheets({version: 'v4', auth: client});
        const opt = {
            spreadsheetId: spreadSheet,
            range: 'Submitted for Removal!A1:A'
        }

        let response = await gsapi.spreadsheets.values.get(opt);
        console.log("Total url count: {}",response.data.values.length);

        return response.data.values.flat().
        filter(url => url.startsWith('http'));

    } catch (err) {
        console.log("Error occurred", err)
    }
}

module.exports = fetchDataFromClientSheet;