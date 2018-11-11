'use strict';

import crypto from 'crypto';

class Client {
    constructor(fname, lname, phone = '', address = '', apt = '', state = 'Alabama', country = 'United States') {
        if (!fname) throw new Error("First name is undefined");
        if (!lname) throw new Error("Last name is undefined");
        this._id = this._generateId();
        this.date_created = new Date();
        this.first_name = fname;
        this.last_name = lname;
        this.phone_number = phone;
        this.street_address = address;
        this.appartment_number = apt;
        this.state = state;
        this.country = country;
    }

    get client_id() {
        return this._id;
    }

    _generateId() {
        const id = Date.now() + crypto.randomBytes(15).toString('hex');
        const hash = crypto.createHash('md5').update(id).digest('hex');
        return hash;
    }
}

module.exports.Client = Client;