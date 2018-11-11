import { app, dialog } from 'electron';
import { Client } from './Client';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';
import filetype from 'file-type';
import PouchDB from 'pouchdb';
import config from '../config';

let dbdir = path.join(app.getPath('userData'), 'pouchdb');
if (!fs.existsSync(dbdir)) {
    fs.mkdirSync(dbdir);
}
const Pouch = PouchDB.defaults({
    prefix: dbdir + '\\'
});

const clientdb = new Pouch(config.database.names.clients);
const asyncReadFile = promisify(fs.readFile);

exports.createOpenDialog = (event, id) => {
    dialog.showOpenDialog({
        defaultPath: app.getPath('documents'),
        filters: [
            {
                name: 'Upload',
                extensions: ['jpg', 'png', 'gif', 'pdf', 'docx', 'doc']
            }
        ],
        properties: ['openFile', 'multiSelections']
    }, files => {
        if (files && files.length > 0) {
            exports.saveAttachments(event, id, files);
        }
    });
};

exports.saveAttachments = async (event, id, files) => {
    const doc = await clientdb.get(id, { attachments: true }).catch(console.error);
    if (!doc._attachments) doc._attachments = {};
    try {
        for (let i = 0; i < files.length; i++) {
            const data = await asyncReadFile(files[i]).catch(console.error);
            const type = filetype(data);
            const fname = crypto.randomBytes(15).toString('hex') + '.' + type.ext;
            doc._attachments[fname] = {
                content_type: type.mime,
                data: data
            }
        }
    } catch (err) {
        console.error(err);
        event.sender.send('error', err);
    }
    clientdb.put(doc).then(() => {
        exports.fetchAttachments(event, id);
    }).catch(err => {
        console.error(err);
        event.sender.send('error', err);
    });
};

exports.downloadFile = async (event, cid, fname) => {
    const data = await clientdb.getAttachment(cid, fname).catch(console.error);
    const type = filetype(data);
    dialog.showSaveDialog({
        defaultPath: fname,
        filters: [
            {
                name: '',
                extensions: [type.ext]
            }
        ]
    }, path => {
        fs.writeFile(path, data, function (err) {
            if (err) event.sender.send('error', err);

        });
    });
};

exports.deleteFile = async (event, cid, fname) => {
    const data = await clientdb.get(cid).catch(console.error);
    clientdb.removeAttachment(cid, fname, data._rev).catch(console.error);
};

exports.deleteClient = async (event, id) => {
    try {
        const doc = await clientdb.get(id);
        doc._deleted = true;
        await clientdb.put(doc);
        exports.fetchAllClients(event);
    } catch (err) {
        event.sender.send('error', err);
    }
};

exports.fetchAttachments = async (event, id) => {
    const data = await clientdb.get(id, { attachments: true }).catch(console.error);
    event.sender.send('refresh-attachments', data);
};

exports.fetchClient = async (event, id) => {
    clientdb.get(id, { attachments: true }).then(doc => {
        event.sender.send('fetch-client-response', doc);
    }).catch(err => {
        event.sender.send('error', err);
    });
};

exports.fetchAllClients = async (event) => {
    clientdb.allDocs({ include_docs: true }).catch(err => {
        event.sender.send('error', err);
    }).then(docs => {
        if (!docs) {
            docs = [];
        } else {
            docs = docs.rows;
            docs.sort((a, b) => {
                a = new Date(a.doc.date_created);
                b = new Date(b.doc.date_created);
                return a > b ? -1 : a < b ? 1 : 0;
            });
        }
        event.sender.send('all-clients-response', docs);
    });
};

exports.updateClient = async (event, client) => {
    if (!client.fname || !client.lname) return new Error("Both first and last name are required for each client.");
    let tclient = client;
    if (tclient._id) {
        tclient = await clientdb.get(client._id).catch(console.error);
        tclient.date_update = new Date();
        tclient.first_name = client.fname;
        tclient.last_name = client.lname;
        tclient.phone_number = client.phone;
        tclient.street_address = client.address;
        tclient.appartment_number = client.apt;
        tclient.state = client.state;
        tclient.country = client.country;
    } else {
        tclient = new Client(
            client.fname,
            client.lname,
            client.phone,
            client.address,
            client.apt,
            client.state,
            client.country
        );
    }

    try {
        await clientdb.put(tclient).catch(console.error);
        exports.fetchAllClients(event);
    } catch (err) {
        console.error(err);
        event.sender.send('error', err);
    }
};

exports.showMessageBox = (event, type, title, message) => {
    dialog.showMessageBox({
        type: type,
        title: title,
        message: message
    });
};
