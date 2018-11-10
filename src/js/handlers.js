import { app, dialog } from 'electron';
import { Client } from './Client';
import PouchDB from 'pouchdb';
import config from '../config';

const clientdb = new PouchDB(config.database.names.clients);

exports.createOpenDialog = () => {
    dialog.showOpenDialog({
        defaultPath: app.getPath('documents'),
        filters: [
            {
                name: 'Upload',
                extensions: ['jpg', 'png', 'gif', 'pdf', 'txt', 'docx', 'doc']
            }
        ],
        properties: ['openFile', 'multiSelections']
    }, files => {
        if (files && files.length > 0) {
            console.log(files);
        }
    });
};

exports.saveFilesFromPath = async files => {

};

exports.fetchClient = async (event, id) => {
    clientdb.get(id).then(doc => {
        event.sender.send('fetch-client-response', doc);
    }).catch(err => {
        event.sender.send('error', err);
    });
};

exports.fetchAllClients = async event => {
    clientdb.allDocs({ include_docs: true }).catch(err => {
        event.sender.send('error', err);
    }).then(docs => {
        event.sender.send('all-clients-response', docs.rows);
    });
};

exports.updateClient = async (event, client) => {
    if (!client.fname || !client.lname) return new Error("Both first and last name are required for each client.");
    const newClient = new Client(
        client.fname,
        client.lname,
        client.phone,
        client.address,
        client.apt,
        client.state,
        client.country
    );
    if (client._id) newClient.setID(client._id);

    try {
        await dbput(newClient);
        exports.fetchAllClients(event);
    } catch (err) {
        console.error(err);
        event.sender.send('error', err);
    }
};

const dbput = async doc => {
    return new Promise(async (resolve, reject) => {
        let rev;
        try {
            rev = await dbget(doc._id);
        } catch (err) {
            rev = null;
        }
        if (rev) doc._rev = rev._rev;
        clientdb.put(doc).catch(err => {
            reject(err);
        }).then(resolve);
    });
};

const dbget = async id => {
    return new Promise((resolve, reject) => {
        clientdb.get(id).catch(reject).then(resolve);
    });
};