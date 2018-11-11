import Inputmask from 'inputmask';
import { ipcRenderer } from 'electron';

$(document).ready(() => {
    ipcRenderer.on('error', (event, err) => {
        alert(JSON.stringify(err));
    });
    ipcRenderer.on('all-clients-response', (event, clients) => {
        loadClientCards(clients);
    });
    ipcRenderer.on('fetch-client-response', (event, client) => {
        resetClientModal(client);
    });
    ipcRenderer.on('refresh-attachments', (event, data) => {
        refreshAttachments(data);
    });

    // Load client cards on init
    ipcRenderer.send('fetch-all-clients');

    // Initialize dropdowns
    $('.ui.dropdown').dropdown();

    // Handle search
    $("#search_clients").on("keyup", function () {
        var value = $(this).val().toLowerCase();
        $("#client_container .card .header").filter(function () {
            $(this).parent().parent().toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });

    // Show modal when card is clicked
    $(document).on('click', '.client.card', function () {
        ipcRenderer.send('fetch-client', $(this).attr('data-client-id'));
        $('#view_client_modal').modal({
            blurring: true,
            allowMultiple: true
        }).modal('show');
    });
    // New client button press
    $(document).on('click', '#new_client_btn', () => {
        resetClientModal();
        $('#view_client_modal').modal({
            blurring: true,
            allowMultiple: true
        }).modal('show');
    });
    // Delete client
    $(document).on('click', '#delete_client_btn', () => {
        resetPrompt('question', 'Delete this client?', 'This action can not be undone!');
        $('#prompt')
            .modal({
                closable: false,
                onDeny: function () {
                    $('#prompt').modal('hide', () => {
                        $('#view_client_modal').modal('show');
                    });
                },
                onApprove: function () {
                    ipcRenderer.send('delete-client', $('#view_client_modal').attr('data-client-id'));
                    $('#prompt').modal('hide');
                }
            })
            .modal('show');
    });
    // Download file
    $(document).on('click', '#download_file', function () {
        let cid = $(this).attr('data-client-id');
        let fname = $(this).attr('data-file-name');
        ipcRenderer.send('download-file', cid, fname);
    });
    // Delete file
    $(document).on('click', '#delete_file', function () {
        let cid = $(this).attr('data-client-id');
        let fname = $(this).attr('data-file-name');
        ipcRenderer.send('delete-file', cid, fname);
        $(this).parent().parent().parent().remove();
    });

    // Date range button press
    $(document).on('click', '#apply_date_range', function () {
        const start = new Date($('#rangestart').calendar('get date'));
        const end = new Date($('#rangeend').calendar('get date'));
        $('.client.card').each((i, e) => {
            let tdate = new Date($(e).attr('data-date-created'));
            if (tdate >= start && tdate <= end) {
                $(e).show();
            } else {
                $(e).hide();
            }
        });
    });
    $(document).on('click', '#reset_date_range', function () {
        $('#rangestart').calendar('clear');
        $('#rangeend').calendar('clear');
        $('.client.card').show();
    });

    $('#rangestart').calendar({
        type: 'date',
        endCalendar: $('#rangeend')
    });
    $('#rangeend').calendar({
        type: 'date',
        startCalendar: $('#rangestart')
    });

    // Handle save client button press
    $('#save_client_btn').on('click', () => {
        const client = {
            date_created: $('input[name="date_created"]').val().trim(),
            fname: $('input[name="fname"]').val().trim(),
            lname: $('input[name="lname"]').val().trim(),
            phone: $('input[name="phone"]').val().trim(),
            address: $('input[name="address"]').val().trim(),
            apt: $('input[name="apt"]').val().trim(),
            state: $('select[name="state"]').val().trim(),
            country: $('input[name="country"]').val().trim()
        };
        if (!client.fname || !client.lname) {
            return ipcRenderer.send('show-message-box', 'error', 'Error', 'You must provide both a first and last name for each client.');
        } else {
            const id = $('#view_client_modal').attr('data-client-id');
            if (id && id !== '') client._id = id;
            ipcRenderer.send('update-client', client);
        }
    });

    // Initialize input masks
    Inputmask().mask($('.input_mask'));

    // Handle upload button press
    $('#upload_button').on('click', () => {
        ipcRenderer.send('create-open-dialog', $('#view_client_modal').attr('data-client-id'));
    });

    // Handle drag-drop upload
    $('#dragdrop').on('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
    });

    $('#dragdrop').on('dragleave', (event) => {
        event.preventDefault();
        event.stopPropagation();
    });

    $('#dragdrop').on('drop', (e) => {
        if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length) {
            e.preventDefault();
            e.stopPropagation();
            const files = e.originalEvent.dataTransfer.files;
            const paths = [];
            for (let key in files) {
                if (!files.hasOwnProperty(key)) continue;
                paths.push(files[key].path);
            }
            ipcRenderer.send('save-attachments', $('#view_client_modal').attr('data-client-id'), paths);
        }
    });
});

const refreshAttachments = client => {
    const attContainer = $('#attachment_container');
    attContainer.html('');
    for (let key in client._attachments) {
        if (!client._attachments.hasOwnProperty(key)) continue;
        let ext = key.split('.')[1].toLowerCase();
        let icon = 'file outline';
        if (ext == 'png' || ext == 'jpg' || ext == 'gif' || ext == 'png') icon = 'file image outline';
        if (ext == 'pdg') icon = 'file pdf outline';
        if (ext == 'doc' || ext == 'docx') icon = 'file word outline';
        attContainer.append(`
            <div class="ui raised link card">
                <div class="content">
                    <span><i class="${icon} icon"></i> ${ext}</span>
                </div>
                <div class="extra content">
                    <span>
                        <button id="delete_file" class="ui red icon button" data-file-name="${key}" data-client-id="${client._id}" type="button"><i class="trash alternate outline icon"></i></button>
                        <button id="download_file" class="ui icon button" data-file-name="${key}" data-client-id="${client._id}" type="button"><i class="download icon"></i></button>
                    </span>
                </div>
            </div>
        `);
    }
};

const resetClientModal = client => {
    if (!client) {
        $('#client_modal_header').html("New Client");
        $('input').val('');
        $('#view_client_modal').attr('data-client-id', '');
        $('#attachment_container').html('');
        $('#delete_client_btn').hide();
    } else {
        $('#delete_client_btn').show();
        $('#view_client_modal').attr('data-client-id', client._id);
        $('#client_modal_header').html(`${client.first_name} ${client.last_name} <span class="small_text">ID: ${client._id}</span>`);
        $('input[name="date_created"]').val(client.date_created);
        $('input[name="fname"]').val(client.first_name);
        $('input[name="lname"]').val(client.last_name);
        $('input[name="phone"]').val(client.phone_number);
        $('input[name="address"]').val(client.street_address);
        $('input[name="apt"]').val(client.appartment_number);
        $('#country_select').dropdown('set selected', client.country);
        $('select[name="state"] option[value="' + client.state + '"]').attr('selected', 'select');
        const attContainer = $('#attachment_container');
        attContainer.html('');
        if (client._attachments) {
            for (let key in client._attachments) {
                if (!client._attachments.hasOwnProperty(key)) continue;
                let ext = key.split('.')[1].toLowerCase();
                let icon = 'file outline';
                if (ext == 'png' || ext == 'jpg' || ext == 'gif' || ext == 'png') icon = 'file image outline';
                if (ext == 'pdf') icon = 'file pdf outline';
                if (ext == 'doc' || ext == 'docx') icon = 'file word outline';
                attContainer.append(`
                    <div class="ui raised link card">
                        <div class="content">
                            <span><i class="${icon} icon"></i> ${ext}</span>
                        </div>
                        <div class="extra content">
                            <span>
                                <button id="delete_file" class="ui red icon button" data-file-name="${key}" data-client-id="${client._id}" type="button"><i class="trash alternate outline icon"></i></button>
                                <button id="download_file" class="ui icon button" data-file-name="${key}" data-client-id="${client._id}" type="button"><i class="download icon"></i></button>
                            </span>
                        </div>
                    </div>
                `);
            }
        }
    }
}

const resetPrompt = (icon, title, desc) => {
    const p = $('#prompt');
    p.find('.header').html(`<i class="${icon} icon"></i> ${title}`);
    p.find('.content p').html(desc);
};

const loadClientCards = clients => {
    const clientContainer = $('#client_container');
    clientContainer.html('');
    clients.forEach(client => {
        client = client.doc;
        clientContainer.append(`
            <a class="ui client card" href="javascript:void(0)" data-client-id="${client._id}" data-date-created="${client.date_created}">
                <div class="content">
                    <div class="header">${client.first_name} ${client.last_name}</div>
                    <div class="meta">
                        <span class="category">${client.phone_number}</span>
                    </div>
                    <div class="meta">
                        <span class="category">${client.street_address}</span>
                    </div>
                </div>
                <div class="extra content">
                    <i class="calendar check outline icon"></i>
                    Added on ${moment(client.date_created).format('MMM Do, YYYY')}
                </div>
            </a>
        `);
    });
};
